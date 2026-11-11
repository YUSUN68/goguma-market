import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인한 사람만 들어갈 수 있는 경로 (정규식, 나중에 /chat 등을 추가해요)
const PROTECTED_PATHS = [/^\/products\/new$/, /^\/products\/\d+\/edit$/, /^\/me$/];
// 로그인한 사람은 들어올 필요 없는 경로
const AUTH_PATHS = ["/login", "/signup"];

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

  if (user && AUTH_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
