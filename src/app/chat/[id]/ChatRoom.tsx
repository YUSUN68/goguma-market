"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createRealtimeClient } from "@/lib/supabase/client";
import { announceNotificationsRead } from "@/components/HeaderIcons";
import type { ChatMessage } from "@/lib/chat";
import { markRoomRead, sendMessage } from "../actions";

type Props = {
  roomId: number;
  myId: string;
  otherName: string;
  iAmSeller: boolean;
  initialOtherReadAt: string | null;
  initialMessages: ChatMessage[];
};

// 보내는 중인 메시지는 pending 표시를 해서 흐리게 보여줘요.
// afterId: 보낼 때 화면에 있던 가장 큰 메시지 id (진짜 메시지가 도착했는지 알아보는 데 써요)
type ShownMessage = ChatMessage & { pending?: boolean; afterId?: number };

export default function ChatRoom({ roomId, myId, otherName, iAmSeller, initialOtherReadAt, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  // 상대가 마지막으로 읽은 시각. 이보다 먼저 보낸 내 메시지는 '읽음'이에요.
  const [otherReadAt, setOtherReadAt] = useState(initialOtherReadAt);
  // useOptimistic: 서버 응답 전에 내 메시지를 먼저 화면에 띄워요.
  // 진짜 메시지(같은 내용, 더 큰 id)가 이미 목록에 들어왔으면 임시 메시지는 빼요.
  // (안 빼면 진짜 메시지와 '보내는 중'이 잠깐 두 개로 보여요)
  const [shown, addOptimistic] = useOptimistic<ShownMessage[], ShownMessage>(messages, (state, temp) =>
    state.some((m) => m.id > (temp.afterId ?? 0) && m.sender_id === temp.sender_id && m.body === temp.body)
      ? state
      : [...state, temp],
  );
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  // 같은 메시지가 두 번 들어오지 않게 (내가 보낸 건 서버 응답 + Realtime 두 군데서 와요)
  function addMessage(m: ChatMessage) {
    setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
  }

  // Realtime: 이 방에 새 메시지가 INSERT되면 Supabase가 바로 알려 줘요 (RLS로 이 방 사람만 받아요)
  useEffect(() => {
    // 읽음 처리 + 헤더 종 아이콘에 알리기.
    // 다른 탭을 보고 있을 때(화면이 안 보일 때)는 읽은 게 아니니까 하지 않아요.
    const markRead = () => {
      if (document.visibilityState === "visible") markRoomRead(roomId).then(announceNotificationsRead);
    };
    markRead();
    // 다른 탭에 있다가 이 탭으로 돌아오면 그때 읽음 처리해요
    document.addEventListener("visibilitychange", markRead);

    let cleanup = () => {};
    let cancelled = false;
    createRealtimeClient().then((supabase) => {
      if (cancelled) return; // 구독 준비 중에 화면을 떠났으면 그만둬요
      const channel = supabase
        .channel(`room-${roomId}`)
        // 새 메시지 도착
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
          (payload) => {
            const m = payload.new as ChatMessage;
            addMessage(m);
            // 보고 있는 중에 온 메시지는 바로 읽음 처리해요
            if (m.sender_id !== myId) markRead();
          },
        )
        // 방 정보가 바뀜 → 상대가 읽었으면 '안 읽음'을 '읽음'으로
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "chat_rooms", filter: `id=eq.${roomId}` },
          (payload) => {
            const room = payload.new as { buyer_last_read_at: string | null; seller_last_read_at: string | null };
            setOtherReadAt(iAmSeller ? room.buyer_last_read_at : room.seller_last_read_at);
          },
        )
        .subscribe();
      cleanup = () => supabase.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", markRead);
      cleanup();
    };
  }, [roomId, myId, iAmSeller]);

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [shown.length]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    setError(null);
    const afterId = messages.reduce((max, m) => Math.max(max, m.id), 0);
    startTransition(async () => {
      addOptimistic({
        id: -Date.now(),
        room_id: roomId,
        sender_id: myId,
        body,
        created_at: new Date().toISOString(),
        pending: true,
        afterId,
      });
      const result = await sendMessage(roomId, body);
      // await 뒤의 상태 변경도 transition으로 묶어야, 임시 메시지가 빠지는 것과 같은 순간에 화면에 반영돼요
      if (result.message) startTransition(() => addMessage(result.message!));
      else {
        setError(result.error ?? "메시지를 보내지 못했어요.");
        setText(body); // 실패하면 입력칸에 되돌려 놓아요
      }
    });
  }

  return (
    <>
      <div className="h-[55vh] min-h-72 flex-1 space-y-2 overflow-y-auto bg-cream/50 p-4">
        {shown.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-soft">
            {otherName}님에게 첫 메시지를 보내 보세요 👋
          </p>
        )}
        {shown.map((m, i) => {
          const mine = m.sender_id === myId;
          const prev = shown[i - 1];
          const day = dayLabel(m.created_at);
          const newDay = !prev || dayLabel(prev.created_at) !== day;
          return (
            <div key={m.id}>
              {newDay && <p className="my-3 text-center text-xs text-ink-soft">{day}</p>}
              <div className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                <p
                  className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] ${
                    mine ? "rounded-br-md bg-skin text-white" : "rounded-bl-md border border-line bg-white"
                  } ${m.pending ? "opacity-60" : ""}`}
                >
                  {m.body}
                </p>
                <span className={`flex shrink-0 flex-col text-[10px] text-ink-soft ${mine ? "items-end" : ""}`}>
                  {/* 내 메시지: 상대가 마지막으로 읽은 시각보다 먼저 보낸 거면 '읽음' */}
                  {mine && !m.pending && (
                    otherReadAt && Date.parse(m.created_at) <= Date.parse(otherReadAt) ? (
                      <span>읽음</span>
                    ) : (
                      <span className="font-bold text-flesh">안 읽음</span>
                    )
                  )}
                  <span>{m.pending ? "보내는 중" : timeOf(m.created_at)}</span>
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form
        action={send}
        className="flex items-end gap-2 border-t border-line p-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter는 보내기, Shift+Enter는 줄바꿈. 한글 조합 중(isComposing)일 땐 보내지 않아요
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="메시지 보내기"
          aria-label="메시지"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-cream px-4 py-2.5 text-[15px] outline-none focus:border-skin focus:bg-white focus:ring-4 focus:ring-skin/10"
        />
        <button
          disabled={!text.trim()}
          className="h-11 shrink-0 rounded-2xl bg-skin px-4 text-sm font-bold text-white transition hover:bg-skin-dark disabled:opacity-40"
        >
          보내기
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-sm text-red-600">{error}</p>}
    </>
  );
}

// 서버(Vercel은 UTC)와 브라우저의 시간대가 달라도 같은 글자가 나오게 한국 시간으로 고정해요
// (다르면 hydration 오류가 나요: 서버가 그린 HTML과 브라우저가 그린 화면이 달라서)
const TZ = "Asia/Seoul";

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: TZ });
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", timeZone: TZ });
}
