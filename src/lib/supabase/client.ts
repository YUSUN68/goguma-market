import { createBrowserClient } from "@supabase/ssr";

// Realtime 구독 전에 부르세요.
// 페이지를 처음 열 때는 로그인 정보(쿠키)를 읽기 전에 구독이 시작될 수 있어요.
// 그러면 "로그인 안 한 사람"으로 연결돼 RLS 때문에 내 알림·메시지 이벤트를 못 받아요.
// 그래서 로그인 토큰을 먼저 Realtime에 넣어 주고 구독해요.
export async function createRealtimeClient() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  await supabase.realtime.setAuth(data.session?.access_token ?? null);
  return supabase;
}

// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
