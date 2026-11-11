import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 회원가입 인증 메일의 링크를 누르면 여기로 와요.
// URL의 code를 로그인 세션으로 바꿔서 쿠키에 저장해요.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}?welcome=1`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
