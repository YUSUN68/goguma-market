import { createClient } from "@/lib/supabase/server";

// 채팅·알림 관련 타입과 서버 쪽 조회 함수
// (RLS 덕분에 내가 참여한 방, 나에게 온 알림만 조회돼요)

export type ChatMessage = {
  id: number;
  room_id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ChatRoom = {
  id: number;
  product_id: number;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  buyer_last_read_at: string | null; // 구매자가 마지막으로 읽은 시각 (읽음 표시용)
  seller_last_read_at: string | null;
  created_at: string;
  product: { title: string; price: number; status: string; image_paths: string[] } | null;
  buyer: { nickname: string } | null;
  seller: { nickname: string } | null;
};

export type Notification = {
  id: number;
  type: "chat" | "like";
  product_id: number;
  room_id: number | null;
  body: string | null;
  read_at: string | null;
  created_at: string;
  actor: { nickname: string } | null;
  product: { title: string; image_paths: string[] } | null;
};

// chat_rooms는 profiles를 두 번(구매자, 판매자) 가리켜서, 어느 외래키인지 꼭 적어요
const ROOM_COLUMNS =
  "id, product_id, buyer_id, seller_id, last_message, last_message_at, buyer_last_read_at, seller_last_read_at, created_at, " +
  "product:products(title, price, status, image_paths), " +
  "buyer:profiles!chat_rooms_buyer_id_fkey(nickname), " +
  "seller:profiles!chat_rooms_seller_id_fkey(nickname)";

// 내 채팅방 목록 (최근에 대화한 순서)
export async function getMyRooms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(ROOM_COLUMNS)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as ChatRoom[];
}

export async function getRoom(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("chat_rooms").select(ROOM_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as ChatRoom | null;
}

// 방의 메시지 (최근 200개를 오래된 순서로)
export async function getMessages(roomId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, room_id, sender_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as ChatMessage[]).reverse();
}

// 아직 안 읽은 채팅 알림이 있는 방 id들 (채팅 목록에 '새 메시지' 점 찍기용)
export async function getUnreadRoomIds() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("room_id")
    .eq("type", "chat")
    .is("read_at", null);
  return new Set((data ?? []).map((n) => n.room_id as number));
}

// 알림 목록 (최근 50개). notifications도 profiles를 두 번 가리켜서 actor 외래키를 적어요
export async function getNotifications() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, product_id, room_id, body, read_at, created_at, " +
        "actor:profiles!notifications_actor_id_fkey(nickname), product:products(title, image_paths)",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data as unknown as Notification[];
}

// 안 읽은 알림이 하나라도 있는지 (헤더 종 아이콘의 빨간 점)
export async function hasUnreadNotifications() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return (count ?? 0) > 0;
}
