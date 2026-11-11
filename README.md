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

## 4단계: 좋아요(찜)

| 기능 | 파일 |
| --- | --- |
| 하트 버튼 (누르면 바로 반영되는 `useOptimistic`) | `src/components/LikeButton.tsx` |
| 좋아요 누르기/취소 서버 액션 | `src/app/products/actions.ts` → `toggleLike` |
| 마이페이지 '찜한 물건' 탭 (`/me?tab=likes`) | `src/app/me/page.tsx` |

### DB
- `public.likes` (user_id, product_id) — 누가 뭘 찜했는지는 본인만 볼 수 있어요 (RLS)
- `products.like_count` — `likes_sync_count` 트리거가 자동으로 올리고 내려요
- ⚠️ likes가 products와 profiles를 잇게 되면서 관계가 2개가 됐어요. 그래서 판매자 조인은
  `seller:profiles!products_seller_id_fkey(nickname)` 처럼 외래키 이름을 꼭 적어요.

## 필수 입력 표시 · 샘플 데이터

| 기능 | 파일 |
| --- | --- |
| 필수 칸 이름 옆 빨간 `*` (`required`면 자동으로 붙어요) | `src/components/FormField.tsx` → `RequiredMark` |
| 상품 폼의 사진·카테고리·가격에도 `*` 표시 | `src/components/ProductForm.tsx` |

### 샘플 데이터
- 샘플 판매자 2명이 상품 12개를 올려 뒀어요 (사진은 캔버스로 그린 그림).
  - **샘플이웃** (`sample-neighbor@goguma.test`) — 7개
  - **옆집고구마** (`sample-neighbor2@goguma.test`) — 5개
- 비밀번호는 저장하지 않았어요. 지울 때는 Supabase에서 이 계정들의 상품과 `product-images/<계정 id>/` 사진을 같이 지운 뒤 계정을 지워요.

## 5단계: 채팅 · 알림

| 기능 | 파일 |
| --- | --- |
| 상품 상세 '채팅하기' → 방 만들기(있으면 그 방으로) | `src/app/chat/actions.ts` → `startChat` |
| 채팅 목록 (`/chat`, 안 읽은 방에 빨간 점) | `src/app/chat/page.tsx` |
| 채팅방 (`/chat/[id]`, Realtime으로 바로 도착, `useOptimistic`으로 바로 표시, 읽음/안 읽음) | `src/app/chat/[id]/page.tsx`, `ChatRoom.tsx` |
| 채팅하기 버튼 (누르면 '채팅방 여는 중…', `useFormStatus`) | `src/app/products/[id]/ChatButton.tsx` |
| 헤더 💬 채팅 · 🔔 알림 아이콘 (새 알림이 오면 빨간 점) | `src/components/HeaderIcons.tsx` |
| 알림 목록 (`/notifications`, 채팅·좋아요, 열면 모두 읽음) | `src/app/notifications/` |
| 채팅·알림 조회 함수와 타입 | `src/lib/chat.ts` |
| Realtime 구독 전에 로그인 토큰을 넣어 주는 도우미 | `src/lib/supabase/client.ts` → `createRealtimeClient` |

**Realtime**: DB에 행이 추가·변경되면 Supabase가 브라우저로 바로 알려 주는 기능이에요.
새로고침하지 않아도 메시지가 오고 종 아이콘에 점이 켜져요. RLS를 그대로 따라서 내 것만 받아요.

### DB (마이그레이션 `goguma_chat_notifications`)
- `chat_rooms` (product_id, buyer_id, seller_id, last_message…) — 상품 1개 × 구매자 1명 = 방 1개.
  판매자는 트리거가 상품에서 채워요. 당사자 두 명만 볼 수 있어요 (RLS).
- `chat_messages` (room_id, sender_id, body) — 방 당사자만 읽고 쓸 수 있어요.
- `notifications` (user_id, actor_id, type `chat`/`like`, product_id, room_id, body, read_at)
  - 본인 것만 보고, `read_at`(읽음 표시)만 바꿀 수 있어요. 만드는 건 트리거만 해요.
  - `chat_messages_after_insert` 트리거: 방의 마지막 메시지 갱신 + 상대방 알림 (같은 방의 안 읽은 알림이 있으면 새로 쌓지 않고 내용만 바꿔요)
  - `likes_notify` 트리거: 좋아요 → 판매자 알림, 좋아요 취소 → 안 읽은 그 알림 삭제
- `chat_messages`, `notifications`를 Realtime(`supabase_realtime`)에 추가했어요.

### 읽음 표시 (마이그레이션 `goguma_chat_read_receipts`)
- `chat_rooms.buyer_last_read_at`, `seller_last_read_at` — 각자 이 방을 마지막으로 읽은 시각.
  내 메시지가 상대의 '마지막으로 읽은 시각'보다 먼저면 **읽음**, 아니면 **안 읽음**으로 보여요.
- `mark_room_read(room_id)` 함수(security definer) — 내 읽은 시각 갱신 + 이 방 채팅 알림 읽음을 한 번에.
  함수 안에서 `auth.uid()`로 '나'의 칸만 바꿔서, 남의 방·남의 칸은 못 바꿔요.
  (보안 어드바이저가 "로그인 사용자가 security definer 함수를 부를 수 있다"고 경고하는데, 일부러 그렇게 한 거예요)
- `chat_rooms`도 Realtime에 추가 → 상대가 읽는 순간 '안 읽음'이 '읽음'으로 바뀌어요.
- 다른 탭을 보고 있을 때 온 메시지는 읽음 처리하지 않고, 탭으로 돌아왔을 때 읽음 처리해요.
- ⚠️ Next 16(cacheComponents)은 다른 페이지로 가도 채팅방 화면을 지우지 않고 `<Activity>`로 **숨겨 둬요**.
  숨어 있는 동안은 Realtime 구독이 끊겨서 새 메시지·읽음 변화를 놓쳐요. 그래서 채팅방은 구독이 연결될 때마다
  DB에서 '마지막으로 본 메시지 이후' 메시지와 상대의 읽은 시각을 다시 가져와요 (`ChatRoom.tsx`의 `catchUp`).

### 채팅 수 (마이그레이션 `goguma_product_chat_count`)
- 상품 카드의 ♥ 옆에 💬 채팅 수를 보여줘요 (`src/components/ProductCard.tsx`). 내 상품 상세에도 보여요.
- `products.chat_count` — **메시지가 1개 이상 오간 채팅방 수**예요. '채팅하기'만 누르고 말 안 한 방은 안 세요.
  chat_rooms는 당사자만 볼 수 있어서 남이 셀 수 없으니, `like_count`처럼 상품에 숫자로 저장해요.
- 방의 첫 메시지 때 +1 (`chat_message_after_insert`), 메시지가 있던 방이 지워지면 −1 (`chat_rooms_after_delete`).
- `set_updated_at`은 `chat_count`가 바뀔 때도 수정 시각을 건드리지 않아요.
- ⚠️ chat_rooms·notifications는 profiles를 두 번 가리켜요. 조인할 때 외래키 이름을 꼭 적어요
  (예: `buyer:profiles!chat_rooms_buyer_id_fkey(nickname)`).

## 배포
- https://goguma-market-flame.vercel.app (Vercel) — `main`에 push하면 자동 배포돼요
- 환경 변수 2개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)는 Vercel 프로젝트 설정에 있어요
- `vercel.json`의 `"regions": ["icn1"]` — 서버 함수를 **서울**에서 실행해요. Supabase DB도 서울(ap-northeast-2)이라
  DB에 물어볼 때마다 미국(기본값 `iad1`)까지 왕복하지 않아도 돼서 훨씬 빨라요.

## 다음 단계 아이디어
1. 검색
