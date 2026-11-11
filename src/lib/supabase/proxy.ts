import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인한 사람만 들어갈 수 있는 경로 (정규식)
const PROTECTED_PATHS = [
  /^\/products\/new$/,
  /^\/products\/\d+\/edit$/,
  /^\/me$/,
  /^\/chat(\/\d+)?$/,
  /^\/notifications$/,
];

// 모든 요청마다 Supabase 세션(토큰)을 새로 고쳐서 쿠키에 다시 담아요.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 주의: createServerClient와 getClaims 사이에 다른 코드를 넣지 마세요.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;

  if (!user && PROTECTED_PATHS.some((p) => p.test(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 참고: "로그인한 사람이 /login에 오면 홈으로" 처리는 여기서 하지 않아요.
  // getClaims는 토큰 서명만 보기 때문에, 다른 곳에서 로그아웃돼 무효가 된 세션도
  // 로그인 상태로 착각해서 다시 로그인을 못 하게 막아 버려요.
  // 그 처리는 서버에 직접 확인하는 (auth)/layout.tsx 에서 해요.

  return response;
}
