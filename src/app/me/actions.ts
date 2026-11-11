"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NicknameState = { error?: string; ok?: boolean; nickname?: string };

export async function updateNickname(
  _prev: NicknameState,
  formData: FormData,
): Promise<NicknameState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (nickname.length < 2 || nickname.length > 12)
    return { error: "닉네임은 2~12자로 지어 주세요.", nickname };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  // RLS: 본인 프로필만 수정할 수 있어요
  const { error } = await supabase.from("profiles").update({ nickname }).eq("id", user.id);
  if (error) return { error: `저장에 실패했어요: ${error.message}`, nickname };

  // 헤더와 상품 카드에 보이는 닉네임도 바뀌도록 전체 화면을 새로 그려요
  revalidatePath("/", "layout");
  return { ok: true, nickname };
}
