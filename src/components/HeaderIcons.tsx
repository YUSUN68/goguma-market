"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient, createRealtimeClient } from "@/lib/supabase/client";

// 알림을 읽음 처리한 쪽(채팅방, 알림 페이지)이 이 이름으로 window에 신호를 보내요
export const NOTIFICATIONS_READ_EVENT = "goguma:notifications-read";

export function announceNotificationsRead() {
  window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
}

// 헤더의 💬 채팅, 🔔 알림 아이콘.
// 안 읽은 알림이 있으면 종 아이콘에 빨간 점을 찍어요.
export default function HeaderIcons({ userId, initialUnread }: { userId: string; initialUnread: boolean }) {
  const [hasUnread, setHasUnread] = useState(initialUnread);
  const pathname = usePathname();

  // 안 읽은 알림이 있는지 DB에 다시 물어봐요 (RLS로 내 알림만 세요)
  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    setHasUnread((count ?? 0) > 0);
  }, []);

  // Realtime: 내 알림이 생기거나(INSERT) 읽음 처리되면(UPDATE) 바로 다시 세요
  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;
    createRealtimeClient().then((supabase) => {
      if (cancelled) return;
      const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => refresh(),
        )
        .subscribe();
      cleanup = () => supabase.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [userId, refresh]);

  // 다른 페이지로 이동할 때도 한 번 확인해요
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부(DB) 상태와 맞추는 용도
    refresh();
  }, [pathname, refresh]);

  // 같은 브라우저에서 '읽음 처리'를 끝냈다는 신호를 받으면 다시 확인해요.
  // (페이지를 처음 열 때는 Realtime 연결이 준비되기 전에 읽음 처리가 끝나서 이벤트를 놓칠 수 있어요)
  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_READ_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_READ_EVENT, refresh);
  }, [refresh]);

  const iconClass =
    "relative flex h-8 w-8 shrink-0 items-center sm:h-9 sm:w-9 justify-center rounded-full text-ink-soft transition hover:bg-skin-soft hover:text-skin";

  return (
    <>
      <Link href="/chat" className={iconClass} aria-label="채팅" title="채팅">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinejoin="round" d="M4 5h16v11H9l-5 4V5Z" />
        </svg>
      </Link>
      <Link
        href="/notifications"
        className={iconClass}
        aria-label={hasUnread ? "알림 (새 알림 있음)" : "알림"}
        title="알림"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinejoin="round" d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
          <path strokeLinecap="round" d="M10 21h4" />
        </svg>
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 animate-pop-in rounded-full border-2 border-cream bg-red-500" />
        )}
      </Link>
    </>
  );
}
