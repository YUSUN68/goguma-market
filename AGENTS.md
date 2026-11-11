# 고구마마켓 — 에이전트 작업 안내

동네 중고거래 사이트 **고구마마켓** (Next.js 16 + Supabase + Tailwind v4).
기능 목록과 파일 위치는 `README.md`에 단계별로 정리돼 있어요.

## 1. 이 프로젝트는 "개발 공부용"이에요

- 사용자는 **개발을 공부하면서 한 단계씩** 만들고 있어요. 한 번에 한 기능(한 단계)만 하고, 요청하지 않은 기능을 미리 만들지 마세요.
- 코드 주석과 설명은 **쉬운 한국어**로, "왜 이렇게 하는지"를 적어 주세요. 새로운 개념(RLS, 트리거, Suspense, 서버 액션, useOptimistic 등)이 처음 나오면 한두 줄로 설명해요.
- 단계를 마치면 `README.md`에 "N단계" 섹션(기능 | 파일 표 + DB 변경)을 추가해요.
- 새 라이브러리 추가나 큰 구조 변경(폴더 구조, 상태관리 도입 등)은 먼저 사용자에게 물어봐요.
- 커밋 메시지는 한국어로 써요.

## 2. Supabase는 "가계부"와 같은 프로젝트를 재활용 중 ⚠️

- 프로젝트 ref: `wkdhpcyuuhnpoqdzhefp` — **꿀꿀 가계부**(`Desktop/가계부`, 정적 HTML)와 **같은 DB**를 써요. 배포 주소만 따로예요.
- 가계부 테이블 **`ledger_entries`는 절대 건드리지 마세요** (구조 변경·삭제·RLS 변경 금지).
- `auth.users`도 두 앱이 공유해요. `on_auth_user_created` 트리거(→ `profiles` 생성)는 이 프로젝트의 **모든 가입**에 실행되니, 트리거를 바꿀 때 조심하세요.
- **DB 변경은 라이브 사이트에 즉시 반영돼요.** 로컬 DB나 브랜치가 없어요. 그래서:
  - 마이그레이션을 적용하기 전에, **지금 배포된 코드의 쿼리가 깨지지 않는지** 먼저 생각하세요.
  - 실제 사례: `likes` 테이블을 추가하자 products↔profiles 관계가 2개가 되어, 배포된 `seller:profiles(nickname)` 조회가 에러를 냈어요. → 조인할 때는 **외래키 이름을 명시**해요: `seller:profiles!products_seller_id_fkey(nickname)`
  - 컬럼 삭제·이름 변경처럼 기존 코드를 깨는 변경은 "코드 먼저 배포 → DB 변경" 순서로 해요.
- 새 테이블은 **반드시 RLS를 켜고 정책을 만들고**, 적용 후 Supabase 보안 어드바이저(get_advisors)로 확인해요.
- 다른 사람 행을 바꿔야 하는 집계(예: `like_count`)는 `security definer` 트리거로 하고, 그 함수의 실행 권한은 `revoke`해요.
- 이메일 인증은 **꺼져 있어요** (가입하면 바로 로그인).
- 키는 publishable 키만 써요 (`.env.local`, Vercel 환경 변수). service_role/secret 키는 코드에 넣지 마세요.

## 3. 실제 데이터 다루기

- `auth.users`에 있는 계정(고구미, 고구마마마 등)은 **사용자 본인의 실제 계정**이에요. 닉네임·상품을 함부로 바꾸거나 지우지 마세요.
- 테스트할 때는 `@goguma.test` 같은 테스트 계정/상품을 만들고, **끝나면 꼭 지워요** (상품을 지우면 Storage 사진도 같이 지워졌는지 확인).
- 사용자의 로그인 세션을 로그아웃시키지 마세요.

## 4. 인증 주의사항

- `src/proxy.ts`(→ `src/lib/supabase/proxy.ts`)는 `getClaims()`로 **토큰 서명만** 확인해요. 다른 곳에서 로그아웃돼 무효가 된 세션도 "로그인됨"으로 볼 수 있어요.
  - 그래서 proxy에서는 "로그인 안 했으면 로그인 화면으로"만 하고, **"로그인했으면 /login에서 내보내기"는 하지 않아요.** 그건 `(auth)/layout.tsx`에서 `getUser()` 기반의 `getCurrentUser()`로 해요.
  - 실제 권한 확인(내 상품인지 등)은 서버 액션 + RLS에서 해요.
- 로그아웃은 `signOut({ scope: "local" })` — 기본값(global)은 모든 기기에서 로그아웃시켜요.
- 로그인이 필요한 경로는 `PROTECTED_PATHS`(정규식 배열)에 추가해요.

## 5. Next.js 16 주의사항 (이 버전은 예전과 달라요)

- `cacheComponents: true`라서 쿠키·`searchParams`·`params`처럼 **요청마다 달라지는 값은 `<Suspense>` 안의 컴포넌트에서** 읽어야 해요. 안 그러면 "runtime data during prerendering" 에러가 나요.
- `createClient()`(서버)는 `await connection()`을 먼저 불러요. 지우지 마세요.
- 미들웨어 파일 이름은 `middleware.ts`가 아니라 **`proxy.ts`** 예요.
- 서버 액션 요청 크기는 `next.config.ts`에서 8mb로 늘려 놨어요. 사진은 브라우저에서 `resizeImage`로 줄여서 보내요.
- 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 문서를 확인하세요 (아래 블록 참고).

## 6. 개발 환경 (Windows)

- Node는 winget으로 설치했어요. 에이전트의 Bash에서는 PATH에 없을 수 있어서 이렇게 앞에 붙여요:
  `export PATH="/c/Users/student/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.20.0-win-x64:$PATH"`
- 확인 순서: `npx tsc --noEmit` → `npm run lint` → (큰 변경이면) `npx next build` → 브라우저로 직접 확인.
- `.env.local`은 git에 올리지 않아요 (`.env.example`만 올려요).

## 7. 배포

- GitHub `YUSUN68/goguma-market`의 **`main`에 push하면 Vercel이 자동 배포**해요 → https://goguma-market-flame.vercel.app
- 환경 변수 2개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)는 Vercel 프로젝트에 들어 있어요.
- push는 사용자가 요청할 때 해요.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
