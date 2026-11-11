"use client";

import { useEffect } from "react";
import { announceNotificationsRead } from "@/components/HeaderIcons";
import { markAllRead } from "./actions";

// 알림 페이지를 열면 (화면에는 '새 알림' 표시를 그대로 둔 채) DB에서는 모두 읽음 처리해요.
// 끝나면 헤더에 알려서 종 아이콘의 빨간 점을 꺼요.
export default function MarkAllRead() {
  useEffect(() => {
    markAllRead().then(announceNotificationsRead);
  }, []);
  return null;
}
