# 한빛제 익명 게시판

한빛고등학교 코딩동아리가 축제 당일 운영하는 익명 게시판입니다.
자세한 명세는 [`CLAUDE.md`](./CLAUDE.md)에 있습니다.

## 처음 세팅하는 순서

1. **Supabase 프로젝트 생성** → SQL Editor에 `supabase/schema.sql` 전체를 붙여넣고 실행
2. **이메일 인증 끄기** — Authentication → Sign In / Providers → Email → "Confirm email" **off**
   (이걸 안 끄면 축제 당일 가입이 마비됩니다)
3. **의존성 설치**

   ```bash
   npm install
   ```

4. **`.env.local` 생성** — `.env.example`을 복사해서 값을 채웁니다.

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

   `SUPABASE_SERVICE_ROLE_KEY`에 `VITE_` 접두사를 **절대** 붙이지 마세요.
   붙이면 브라우저에 노출되어 전교생 학번이 조회 가능해집니다.

5. **개발 서버 실행**

   ```bash
   npm run dev
   ```

6. **관리자 계정 만들기** — 관리자로 쓸 이메일로 사이트에서 직접 회원가입한 뒤,
   SQL Editor에서 `supabase/make-admin.sql` 실행

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 로컬 개발 서버 (Netlify Functions는 동작하지 않음) |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |

`/admin` 페이지는 Netlify Functions를 호출하므로, 로컬에서 관리자 기능까지 확인하려면
Netlify CLI가 필요합니다.

```bash
npx netlify dev
```

## 화면

| 경로 | 설명 |
|---|---|
| `/` | 게시판 목록 (비로그인 시 로그인 안내) |
| `/post/:id` | 게시글 상세 + 댓글/대댓글 |
| `/signup` | 회원가입 (이름 · 학번 5자리 · 이메일 · 비밀번호) |
| `/login` | 로그인 |
| `/admin` | 관리자 전용 — 회원 / 게시글 / 댓글 / 신고 |

## 익명 처리 방식

- DB에는 익명 글에도 `user_id`가 그대로 남습니다 (문제 게시물 보고용)
- 프론트엔드는 `posts_public` / `comments_public` 뷰만 조회하고,
  이 뷰는 익명 글의 `author_id`를 `null`로 지워서 내려보냅니다
- 관리자만 Netlify Functions(service_role)를 통해 실명·학번을 볼 수 있습니다
- 게시글·댓글 삭제는 전부 소프트 삭제(`deleted_at`)입니다
