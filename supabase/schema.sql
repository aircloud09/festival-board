-- 축제 익명 게시판 스키마
-- Supabase 대시보드 → SQL Editor에 이 파일 전체를 한 번에 붙여넣고 실행하세요.

-- ============================================
-- 1) 테이블
-- ============================================

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 20),
  student_id  text not null unique check (student_id ~ '^[0-9]{5}$'),
  email       text not null,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 50),
  content      text not null check (char_length(content) between 1 and 1000),
  is_anonymous boolean not null default true,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  parent_id    uuid references public.comments(id) on delete cascade,
  content      text not null check (char_length(content) between 1 and 500),
  is_anonymous boolean not null default true,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

-- ============================================
-- 2) 회원가입 시 profiles 자동 생성 트리거
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, student_id, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'student_id',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 3) RLS 활성화
-- ============================================

alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;
alter table public.likes    enable row level security;
alter table public.reports  enable row level security;

-- profiles: 본인 것만 조회. UPDATE 정책 없음 → 스스로 관리자 승격 불가
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

-- posts: 직접 조회는 본인 글만. 남의 글은 아래 뷰로만 볼 수 있음
create policy "posts_select_own"   on public.posts
  for select to authenticated using (user_id = auth.uid());
create policy "posts_insert_own"   on public.posts
  for insert to authenticated with check (user_id = auth.uid());
create policy "posts_update_own"   on public.posts
  for update to authenticated using (user_id = auth.uid())
                                with check (user_id = auth.uid());

-- comments: 동일
create policy "comments_select_own" on public.comments
  for select to authenticated using (user_id = auth.uid());
create policy "comments_insert_own" on public.comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "comments_update_own" on public.comments
  for update to authenticated using (user_id = auth.uid())
                                with check (user_id = auth.uid());

-- likes: 본인 것만 조회/생성/삭제 (총 개수는 뷰가 계산)
create policy "likes_select_own" on public.likes
  for select to authenticated using (user_id = auth.uid());
create policy "likes_insert_own" on public.likes
  for insert to authenticated with check (user_id = auth.uid());
create policy "likes_delete_own" on public.likes
  for delete to authenticated using (user_id = auth.uid());

-- reports: 생성만 가능. 조회 정책 없음 → 일반 유저는 신고 내역을 못 봄
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- ============================================
-- 4) 익명 처리 뷰 (핵심)
--    security definer 뷰라서 위 RLS를 우회해 전체 행을 읽지만,
--    익명 글의 author_id는 null로 지워서 내려보냄
-- ============================================

create or replace view public.posts_public as
select
  p.id,
  case when p.is_anonymous then null   else p.user_id end as author_id,
  case when p.is_anonymous then '익명' else pr.name   end as author_name,
  p.title,
  p.content,
  p.is_anonymous,
  p.created_at,
  (p.user_id = auth.uid()) as is_mine,
  (select count(*) from public.likes l
     where l.post_id = p.id) as like_count,
  (select count(*) from public.comments c
     where c.post_id = p.id and c.deleted_at is null) as comment_count,
  exists (select 1 from public.likes l
     where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me
from public.posts p
join public.profiles pr on pr.id = p.user_id
where p.deleted_at is null;

create or replace view public.comments_public as
select
  c.id,
  c.post_id,
  c.parent_id,
  case when c.is_anonymous then null   else c.user_id end as author_id,
  case when c.is_anonymous then '익명' else pr.name   end as author_name,
  c.content,
  c.is_anonymous,
  c.created_at,
  (c.user_id = auth.uid()) as is_mine
from public.comments c
join public.profiles pr on pr.id = c.user_id
where c.deleted_at is null;

grant select on public.posts_public    to authenticated;
grant select on public.comments_public to authenticated;

-- ============================================
-- 5) 학번 중복 확인 함수
--    profiles는 본인 행만 조회 가능하므로,
--    가입 전에 학번 중복을 확인하려면 이 함수가 필요함
--    (존재 여부만 true/false로 알려주고 다른 정보는 노출하지 않음)
-- ============================================

create or replace function public.is_student_id_taken(sid text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where student_id = sid);
$$;

grant execute on function public.is_student_id_taken(text) to anon, authenticated;
