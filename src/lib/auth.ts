import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// 지금 로그인한 사람(+닉네임)을 가져와요. 로그아웃 상태면 null.
// React cache로 감싸서 한 번의 요청 안에서는 여러 곳에서 불러도 DB를 한 번만 조회해요.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, created_at")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    nickname: profile?.nickname ?? user.email?.split("@")[0] ?? "고구마",
    joinedAt: profile?.created_at ?? user.created_at,
  };
});
