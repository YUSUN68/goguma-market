"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/chat";

// 상품 상세의 "채팅하기" 버튼: 이미 방이 있으면 그 방으로, 없으면 새로 만들어서 이동해요
export async function startChat(productId: number) {
  const supabase = await createClient();
  // getClaims는 토큰 서명을 서버에서 바로 확인해서 Supabase에 다시 묻지 않아요 (getUser보다 빨라요).
  // 진짜 권한 확인은 아래 insert/select에서 RLS가 해요.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect(`/login?next=/products/${productId}`);

  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (existing) redirect(`/chat/${existing.id}`);

  // 판매자(seller_id)는 DB 트리거가 상품에서 채워 줘요.
  // 내 상품이면 DB의 check(구매자 ≠ 판매자)에 걸려서 만들어지지 않아요.
  const { data: room, error } = await supabase
    .from("chat_rooms")
    .insert({ product_id: productId })
    .select("id")
    .single();
  if (error || !room) redirect(`/products/${productId}`);

  revalidatePath("/chat");
  redirect(`/chat/${room.id}`);
}

export type SendResult = { message?: ChatMessage; error?: string };

// 메시지 보내기. 상대방 알림은 DB 트리거가 만들어요.
export async function sendMessage(roomId: number, text: string): Promise<SendResult> {
  const body = text.trim();
  if (!body) return { error: "메시지를 입력해 주세요." };
  if (body.length > 1000) return { error: "메시지는 1000자까지 보낼 수 있어요." };

  const supabase = await createClient();
  // RLS가 "이 방 사람이고, 내 이름으로 보내는지"를 확인해요
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ room_id: roomId, body })
    .select("id, room_id, sender_id, body, created_at")
    .single();
  if (error) return { error: "메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/chat");
  return { message: data as ChatMessage };
}

// 방을 보고 있으면 읽음 처리해요: 내 '마지막으로 읽은 시각' 갱신 + 이 방 채팅 알림 읽음.
// DB 함수(mark_room_read)를 rpc로 불러요. 함수 안에서 auth.uid()로 '나'만 바꿔요.
export async function markRoomRead(roomId: number) {
  const supabase = await createClient();
  await supabase.rpc("mark_room_read", { p_room_id: roomId });
}
