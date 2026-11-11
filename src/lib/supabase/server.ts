import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// 서버 컴포넌트 / 서버 액션 / 라우트 핸들러에서 쓰는 Supabase 클라이언트
// 로그인 세션은 쿠키에 저장돼요.
export async function createClient() {
  // 요청마다 달라지는 데이터(로그인 정보)라서 미리 만들어 두지 말라고 Next에 알려요
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없어요.
            // proxy.ts가 세션을 갱신해 주므로 무시해도 괜찮아요.
          }
        },
      },
    },
  );
}
