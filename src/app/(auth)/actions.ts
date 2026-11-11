"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
  // 실패해도 입력한 값을 다시 채워 넣기 위해 돌려줘요 (비밀번호는 제외)
  fields?: { email?: string; nickname?: string };
};

// Supabase 영어 에러를 한국어로 바꿔요
function toKorean(message: string) {
  if (message.includes("Invalid login credentials"))
    return "이메일 또는 비밀번호가 맞지 않아요.";
  if (message.includes("Email not confirmed"))
    return "메일함에서 인증 링크를 먼저 눌러 주세요.";
  if (message.includes("User already registered"))
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (message.includes("Password should be"))
    return "비밀번호는 6자 이상이어야 해요.";
  if (message.toLowerCase().includes("rate limit"))
    return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  if (message.includes("invalid") && message.includes("email"))
    return "올바른 이메일 주소를 입력해 주세요.";
  return `문제가 생겼어요: ${message}`;
}

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fields = { email };

  if (!email || !password)
    return { error: "이메일과 비밀번호를 모두 입력해 주세요.", fields };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: toKorean(error.message), fields };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const fields = { email, nickname };

  if (nickname.length < 2 || nickname.length > 12)
    return { error: "닉네임은 2~12자로 지어 주세요.", fields };
  if (password.length < 6)
    return { error: "비밀번호는 6자 이상이어야 해요.", fields };
  if (password !== passwordConfirm)
    return { error: "비밀번호가 서로 달라요.", fields };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // DB 트리거가 이 값으로 profiles 테이블에 닉네임을 저장해요
      data: { nickname },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: toKorean(error.message), fields };

  // 이메일 인증이 꺼져 있으면 바로 세션이 생겨요
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/?welcome=1");
  }

  // 이미 가입된 이메일이면 Supabase는 보안상 에러 대신 빈 identities를 돌려줘요
  if (data.user && data.user.identities?.length === 0)
    return { error: "이미 가입된 이메일이에요. 로그인해 주세요.", fields };

  return {
    message: `${email} 로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요! 🍠`,
  };
}

export async function logout() {
  const supabase = await createClient();
  // scope: "local" → 이 브라우저만 로그아웃 (기본값 global은 모든 기기에서 로그아웃돼요)
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/");
}
