# 학교 축제 익명 게시판 — 프로젝트 명세서

> 이 문서는 프로젝트의 상시 명세서입니다. Claude Code가 매 작업마다 자동으로 참조합니다.

---

## 0. 채워넣은 값

| 자리표시자 | 실제 값 | 바꾸는 곳 |
|---|---|---|
| 학교명 | 한빛고등학교 | `src/lib/config.js` → `SCHOOL_NAME` |
| 축제명 | 한빛제 | `src/lib/config.js` → `FESTIVAL_NAME` |
| 관리자이메일 | aircloud09@gmail.com | `supabase/make-admin.sql` |
| 학번자릿수 | 5 | `src/lib/config.js` + `supabase/schema.sql`의 check 제약 |

학교명·축제명은 화면 표시용 문자열이므로 `src/lib/config.js` 두 줄만 고치면 사이트 전체에 반영됩니다.
학번 자릿수를 바꿀 때는 `config.js`와 DB의 `check (student_id ~ '^[0-9]{5}$')`를 **같이** 고쳐야 합니다.

---

## 1. 프로젝트 개요

한빛고등학교 코딩동아리가 한빛제 당일 하루 공개하는 **익명 게시판 웹사이트**입니다.
에브리타임(에타)의 커뮤니티 기능만 최소한으로 옮긴 형태입니다.

**중요한 전제 두 가지**

1. 학교 행사이므로, 문제 게시물이 올라오면 선생님께 보고해야 합니다.
   따라서 **익명 게시글도 DB에는 반드시 작성자 ID가 남아야 하고**,
   관리자는 회원의 이름·학번·이메일을 조회할 수 있어야 합니다.
2. 동시에, 일반 학생이 브라우저 개발자 도구를 열어서 익명 작성자를 알아내면 안 됩니다.
   → DB에는 저장하되, **프론트엔드로 내려보내는 데이터에서는 익명 글의 user_id를 제거**합니다.
   `posts_public` / `comments_public` 뷰가 그 역할을 합니다.

---

## 2. 기능 범위

### 만드는 기능
- 회원가입 / 로그인 / 로그아웃 (이메일 + 비밀번호)
- 가입 시 이름, 학번(5자리 숫자), 이메일 수집
- 게시판 1개 — 게시글 작성(제목 / 본문 / 익명여부), 목록, 상세
- 좋아요 (로그인 사용자, 중복 불가, 취소 가능)
- 댓글 + 대댓글 (1단계까지, 익명여부 선택 가능)
- 게시글 / 댓글 신고 버튼
- 관리자 페이지 — 회원 목록(이름·학번·이메일), 전체 게시글, 신고 목록, 강제 삭제

### 만들지 않는 기능
이미지 첨부 / 인기게시판 / 검색 / 시간표 / 강의평가 / 쪽지 / 포인트 /
게시글 수정 / 프로필 페이지 / 비밀번호 찾기 / 소셜 로그인

> 위 "만들지 않는 기능"은 요청받지 않는 한 절대 구현하지 마세요.
> 범위를 넘는 제안을 하지 말고, 명세에 있는 것만 정확히 만드세요.

---

## 3. 기술 스택

| 영역 | 기술 | 비고 |
|---|---|---|
| 빌드 | Vite 7 | React 템플릿 |
| 프론트엔드 | React 18 (JavaScript) | TypeScript 사용 안 함 |
| 라우팅 | react-router-dom v6 | |
| 스타일 | Tailwind CSS v4 | `@tailwindcss/vite` 플러그인 |
| 서버 로직 | Netlify Functions | 관리자 API 전용 |
| DB / 인증 | Supabase (PostgreSQL + Auth) | |
| 호스팅 | Netlify | |

**TypeScript를 쓰지 않는 이유**: 동아리원 전원이 JS만 아는 상태에서 타입 에러 디버깅에
시간을 쓰는 것보다, 기능을 완성하는 게 우선입니다.

---

## 4. 파일 구조

```
festival-board/
├── netlify/
│   └── functions/
│       ├── _shared/
│       │   └── admin.js          # 관리자 인증 공통 헬퍼
│       ├── admin-users.js        # GET  회원 목록
│       ├── admin-posts.js        # GET  전체 게시글(삭제된 것 포함)
│       ├── admin-comments.js     # GET  전체 댓글
│       ├── admin-reports.js      # GET  신고 목록
│       └── admin-delete.js       # POST 게시글/댓글 강제 삭제
├── src/
│   ├── components/
│   │   ├── Layout.jsx            # 상단바 + 컨테이너
│   │   ├── PostCard.jsx          # 목록의 게시글 카드
│   │   ├── PostForm.jsx          # 글쓰기 폼
│   │   ├── CommentItem.jsx       # 댓글 1개 (대댓글 포함)
│   │   ├── CommentForm.jsx       # 댓글 입력창
│   │   ├── LikeButton.jsx
│   │   ├── ReportButton.jsx
│   │   ├── Spinner.jsx
│   │   └── ProtectedRoute.jsx    # 로그인/관리자 가드
│   ├── pages/
│   │   ├── BoardPage.jsx         # /
│   │   ├── PostDetailPage.jsx    # /post/:id
│   │   ├── LoginPage.jsx         # /login
│   │   ├── SignupPage.jsx        # /signup
│   │   └── AdminPage.jsx         # /admin
│   ├── lib/
│   │   ├── supabase.js           # Supabase 클라이언트 1개만 생성
│   │   ├── adminApi.js           # Netlify Functions 호출 래퍼
│   │   ├── config.js             # 학교명/축제명/학번 형식
│   │   └── time.js               # 상대시간·날짜 포맷 (직접 구현)
│   ├── hooks/
│   │   └── useAuth.jsx           # AuthContext + useAuth()
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   ├── schema.sql                # 테이블/트리거/RLS/뷰/함수 전체
│   └── make-admin.sql            # 최초 관리자 지정
├── .env.local                    # git에 커밋 금지
├── .env.example                  # 키 없이 이름만
├── .gitignore
├── netlify.toml
├── package.json
└── vite.config.js
```

---

## 5. 데이터베이스 스키마

`supabase/schema.sql` 전체를 Supabase 대시보드 → SQL Editor에 **한 번에** 붙여넣고 실행하세요.
내용 요약:

- 테이블 5개: `profiles`, `posts`, `comments`, `likes`, `reports`
- 회원가입 시 `profiles` 자동 생성 트리거 (`handle_new_user`)
- 모든 테이블 RLS 활성화 — 직접 조회는 **본인 행만** 가능
- 익명 처리 뷰 `posts_public` / `comments_public` — RLS를 우회해 전체 행을 읽지만
  익명 글의 `author_id`는 `null`로 지워서 내려보냄
- 학번 중복 확인 함수 `is_student_id_taken(sid)`

> Supabase Database Linter가 `posts_public` / `comments_public`을 "Security Definer View"라고
> 경고할 수 있습니다. **이 프로젝트에서는 의도한 설정**이므로 무시하면 됩니다.
> 익명 작성자를 가리기 위해 일부러 이렇게 만든 것입니다.

### 이메일 인증 끄기 — 반드시 먼저 할 것

Supabase 대시보드 → Authentication → Sign In / Providers → Email → **"Confirm email" 을 끄세요.**

이 상태로 축제를 열면 학생들이 가입 직후 로그인이 안 되고, 인증 메일이 스팸함으로 가거나
무료 플랜 발송 한도에 막혀서 가입이 사실상 마비됩니다. 하루짜리 교내 행사이고
어차피 이름·학번을 직접 받으므로 이메일 소유 확인은 불필요합니다.

### 최초 관리자 지정

`schema.sql` 실행 후 관리자 계정으로 **직접 회원가입을 한 다음**
`supabase/make-admin.sql`을 실행하세요.

관리자 지정은 이 SQL로만 가능합니다. `profiles`에 UPDATE 정책이 없어서
어떤 학생도 자기 계정을 관리자로 바꿀 수 없습니다.

---

## 6. 환경변수

### `.env.local` (로컬 개발용 — **git에 절대 커밋 금지**)

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 접두사 규칙 — 이것만은 반드시 지킬 것

| 변수 | 브라우저 노출 | 용도 |
|---|---|---|
| `VITE_` 로 시작 | **노출됨** | anon key만 |
| `VITE_` 없음 | 노출 안 됨 | Netlify Functions 전용 |

`SUPABASE_SERVICE_ROLE_KEY`에 `VITE_` 접두사를 붙이면 **모든 학생이 브라우저에서
전교생 학번을 조회할 수 있게 됩니다.** 절대 붙이지 마세요.

Netlify 대시보드 → Site configuration → Environment variables 에도 위 4개를 동일하게 등록합니다.

---

## 7. 페이지 명세

### `/` — BoardPage
- 비로그인 상태면 목록 대신 "로그인이 필요합니다" 안내 + 로그인 버튼
- `posts_public` 뷰에서 `created_at` 내림차순, 20개씩 "더 보기"
- 각 항목은 `PostCard` — 제목 / 작성자 / 상대시간 / 좋아요 수 / 댓글 수
- 우측 하단 고정 플로팅 버튼(+) → 글쓰기 폼 모달 (로그인 시에만 노출)

### `/post/:id` — PostDetailPage
- 상단: 제목, 작성자, 작성시간, 본문(`whitespace-pre-wrap`)
- 본문 아래: 좋아요, 신고, (본인 글이면) 삭제
- 하단: 댓글 목록 + 댓글 입력창
- 없거나 삭제된 글이면 "삭제되었거나 존재하지 않는 게시글입니다" + 목록 링크

### `/signup` — SignupPage
- 입력: 이름 / 학번 / 이메일 / 비밀번호 / 비밀번호 확인
- 검증: 학번 `/^[0-9]{5}$/`, 비밀번호 6자 이상 + 확인란 일치, 이름 1~20자
- 제출 순서: `rpc('is_student_id_taken')` 사전 확인 → `auth.signUp`
- 에러 한국어 변환: `already registered` → 이미 가입된 이메일입니다 /
  `Database error saving new user` → 이미 가입된 학번입니다 / 그 외 → 잠시 후 다시 시도

### `/login` — LoginPage
- 실패 시 "이메일 또는 비밀번호가 올바르지 않습니다", 성공 시 `/`로 이동

### `/admin` — AdminPage
- `ProtectedRoute requireAdmin`으로 감싸기 (조건 미달 시 리다이렉트)
- 탭 4개: 회원 / 게시글 / 댓글 / 신고, 이미 불러온 탭은 재요청하지 않음
- 회원 목록 상단에 "CSV 내보내기" (BOM 포함, 파일명 `회원목록_YYYYMMDD.csv`)

---

## 8. Netlify Functions 명세

### `_shared/admin.js` — `requireAdmin(request)`

1. Authorization 헤더에서 `Bearer <token>` 추출. 없으면 401
2. service_role 키로 만든 supabase 클라이언트로 `auth.getUser(token)`
3. 유효하지 않으면 401
4. `profiles`에서 `is_admin` 조회. false면 403
5. 통과 시 `{ supabase, user }` 반환

service_role 클라이언트는 RLS를 무시하므로, **모든 함수는 반드시 `requireAdmin`을
먼저 통과한 뒤에만** 쿼리해야 합니다.

### 엔드포인트

| 경로 | 메서드 | 응답 |
|---|---|---|
| `/.netlify/functions/admin-users` | GET | `[{ id, name, student_id, email, created_at }]` |
| `/.netlify/functions/admin-posts` | GET | 게시글 전체 + 작성자 실명/학번 + `deleted_at` |
| `/.netlify/functions/admin-comments` | GET | 댓글 전체 + 작성자 실명/학번 + `deleted_at` |
| `/.netlify/functions/admin-reports` | GET | 신고 목록 + 대상 내용 + 신고자 실명 |
| `/.netlify/functions/admin-delete` | POST | body `{ type: 'post'\|'comment', id }` → `deleted_at = now()` |

`admin-delete`는 실제 DELETE가 아니라 **소프트 삭제**입니다.
나중에 선생님이 원본 확인을 요청할 수 있기 때문입니다.

---

## 9. 디자인 토큰

`src/index.css`의 `@theme` 블록에서 설정합니다 (Tailwind v4 방식).

```css
--color-brand: #1565C0;  --color-brand-dark: #0D47A1;
--color-surface: #FFFFFF; --color-canvas: #F7F8FA; --color-line: #E5E7EB;
--color-ink: #1F2937; --color-ink-soft: #6B7280;
--color-danger: #DC2626; --color-like: #EF4444;
--font-sans: "Pretendard Variable", Pretendard, system-ui, sans-serif;
```

Pretendard는 `index.html`에 CDN으로 추가되어 있습니다.
공통 클래스 `.input` / `.btn-primary` / `.btn-ghost` / `.card`는 `index.css`의
`@layer components`에 정의되어 있습니다.

### 레이아웃 규칙
- 단일 컬럼, 최대 너비 `max-w-2xl`, 가운데 정렬
- 카드: 흰 배경 / `border border-line` / `rounded-xl` / `p-4`
- 본문 15px, 제목 17px, 보조 텍스트 13px
- 대댓글은 `pl-6 border-l-2 border-line`로 들여쓰기
- **모바일 우선** — 375px 폭에서 먼저 확인하고 데스크톱을 나중에 맞춤

---

## 10. 배포 절차

1. GitHub 저장소에 push
2. Netlify → Add new site → Import an existing project → GitHub 연결
3. 빌드 설정은 `netlify.toml`을 자동으로 읽으므로 그대로 두기
4. Site configuration → Environment variables 에 4개 변수 등록
5. **Build & deploy → Continuous deployment → Build settings에서 자동 배포를 끄기**
6. Supabase → Authentication → URL Configuration에 Netlify 주소 등록

---

## 11. Netlify 크레딧 관리 규칙

무료 플랜은 **월 300크레딧**이고 **프로덕션 배포 1회당 15크레딧**입니다.
월 20회 배포하면 크레딧이 소진되고, 소진되면 **다음 달까지 사이트가 정지**됩니다.

- 개발 중에는 `npm run dev`(로컬)로만 확인 — 크레딧 소모 없음
- 배포 확인이 필요하면 **브랜치 배포 / Deploy Preview** 사용 — 크레딧 소모 없음
- `main` 자동 배포는 꺼두고, 프로덕션 배포는 수동으로만
- 프로덕션 배포는 **한 달에 5회 이내**, **축제가 있는 달에는 3회 이내**
- 대역폭은 텍스트 전용이라 사실상 신경 쓰지 않아도 됩니다
- 크레딧이 부족해지면 Cloudflare Pages 이전을 고려 (Functions → Pages Functions)

---

## 12. 축제 당일 체크리스트

**전날**
- [ ] 관리자 계정으로 로그인 → `/admin` 4개 탭이 전부 뜨는지 확인
- [ ] 테스트 계정으로 가입 → 글쓰기 → 댓글 → 대댓글 → 좋아요 → 신고 전 과정 확인
- [ ] 관리자 페이지에서 방금 쓴 글을 삭제해보고, 목록에서 사라지는지 확인
- [ ] 테스트로 만든 글과 계정 정리
- [ ] 담당 선생님께 관리자 계정 정보와 `/admin` 주소 전달
- [ ] Netlify 크레딧 잔량 확인

**당일**
- [ ] 실시간 모니터링 담당자 1명 지정 (한 시간에 한 번씩 새 글 확인)
- [ ] 문제 게시물 발견 시: 관리자 페이지에서 삭제 → 화면 캡처 → 선생님께 보고
- [ ] 접속 QR코드를 부스에 부착

**종료 후**
- [ ] Supabase → Authentication → Providers에서 이메일 가입 비활성화
- [ ] 회원 목록 CSV 내보내기해서 보관
- [ ] 팀 회고 진행

---

## 13. 작업 시 지켜야 할 규칙

- 명세에 없는 기능을 임의로 추가하지 마세요. 필요해 보이면 먼저 물어보세요.
- 라이브러리를 새로 설치하기 전에 반드시 물어보세요.
  (날짜 포맷, 아이콘, UI 라이브러리 전부 직접 구현하는 것이 기본입니다)
- TypeScript로 바꾸지 마세요.
- `dangerouslySetInnerHTML`을 절대 쓰지 마세요.
- `SUPABASE_SERVICE_ROLE_KEY`를 `src/` 아래 어떤 파일에서도 참조하지 마세요.
- 익명 게시글 조회 시 `posts` / `comments` 테이블을 직접 쿼리하지 말고
  반드시 `posts_public` / `comments_public` 뷰를 쓰세요.
- 게시글·댓글 삭제는 전부 소프트 삭제(`deleted_at`)입니다. 실제 DELETE를 쓰지 마세요.
- 한 작업이 끝나면 변경한 파일 목록과 확인 방법을 요약해서 알려주세요.
