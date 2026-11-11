"use server";

import { createClient } from "@/lib/supabase/server";

// 내 알림을 전부 '읽음'으로 바꿔요 (RLS 덕분에 내 알림만 바뀌어요)
export async function markAllRead() {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
}
