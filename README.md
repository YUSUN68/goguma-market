# 🍠 고구마마켓

고구마처럼 따끈하고 달달한 동네 중고거래 사이트예요. 개발 공부용으로 단계별로 만들고 있어요.

- **Next.js 16** (App Router, Server Actions, Cache Components)
- **Supabase** — 가계부(`꿀꿀 가계부`)와 **같은 프로젝트(DB)** 를 써요
- **Tailwind CSS v4** + Pretendard 폰트

## 실행하기

```bash
npm install
npm run dev
```

`.env.local` 에 Supabase 주소와 publishable 키가 있어야 해요 (`.env.example` 참고).

## 지금까지 만든 것 (1단계: 회원)

| 기능 | 파일 |
| --- | --- |
| 회원가입 (닉네임·이메일·비밀번호) | `src/app/(auth)/signup/` |
| 로그인 | `src/app/(auth)/login/` |
| 로그아웃 · 서버 액션 | `src/app/(auth)/actions.ts` |
| 로그인 세션 갱신, 접근 제한 | `src/proxy.ts`, `src/lib/supabase/proxy.ts` |
| 지금 로그인한 사람 가져오기 | `src/lib/auth.ts` |
| 이메일 인증 링크 처리 | `src/app/auth/callback/route.ts` |

### DB
- `public.profiles` — 회원 닉네임 (`id`는 `auth.users.id`)
- 회원가입하면 `on_auth_user_created` 트리거가 자동으로 프로필을 만들어요
- RLS: 누구나 닉네임 조회 가능, 수정은 본인만

## 2단계: 상품

| 기능 | 파일 |
| --- | --- |
| 상품 등록 (사진 최대 5장, 브라우저에서 1600px로 줄여서 업로드) | `src/app/products/new/`, `src/lib/resize-image.ts` |
| 등록 · 상태 변경 · 삭제 서버 액션 | `src/app/products/actions.ts` |
| 목록 (카테고리 필터 `?category=`) | `src/app/page.tsx`, `src/components/ProductCard.tsx` |
| 상세 (사진 슬라이드, 내 물건이면 상태 변경/삭제) | `src/app/products/[id]/` |
| DB 조회 함수 · 공통 상수 | `src/lib/queries.ts`, `src/lib/products.ts` |

### DB
- `public.products` — 제목, 가격(0원이면 나눔), 카테고리, 상태(`selling`/`reserved`/`sold`), 사진 경로 배열
  - `seller_id`는 DB가 `auth.uid()`로 자동으로 채워요
  - RLS: 누구나 조회, 등록·수정·삭제는 본인만
- Storage 버킷 `product-images` (공개, 5MB, JPG/PNG/WEBP) — 사진은 `<내 id>/<랜덤>.jpg` 경로에 저장되고, 본인 폴더에만 올리거나 지울 수 있어요

## 3단계: 수정 · 마이페이지

| 기능 | 파일 |
| --- | --- |
| 등록·수정이 같이 쓰는 상품 폼 (사진 순서·대표 사진 바꾸기) | `src/components/ProductForm.tsx` |
| 상품 수정 페이지 (내 상품만) | `src/app/products/[id]/edit/page.tsx` |
| 수정 서버 액션 (빠진 사진은 Storage에서도 삭제) | `src/app/products/actions.ts` → `updateProduct` |
| 마이페이지: 프로필, 상태별 개수, 내 판매 목록 탭 (`?status=`) | `src/app/me/page.tsx` |
| 닉네임 수정 | `src/app/me/NicknameForm.tsx`, `src/app/me/actions.ts` |

로그인이 필요한 경로는 `src/lib/supabase/proxy.ts`의 `PROTECTED_PATHS`(정규식)에 모여 있어요.

## 다음 단계 아이디어
1. 검색, 찜하기
2. 1:1 채팅 (Supabase Realtime)
3. 배포 (가계부와 다른 링크로, 예: Vercel)
