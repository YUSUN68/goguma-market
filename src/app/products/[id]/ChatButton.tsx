"use client";

import { useFormStatus } from "react-dom";

// '채팅하기' 버튼. 누르면 서버가 채팅방을 여는 동안 '여는 중…'으로 바뀌어요.
// useFormStatus: 이 버튼이 들어 있는 <form>이 지금 제출 중인지 알려 주는 훅이에요.
export default function ChatButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-2xl bg-skin py-3.5 font-bold text-white transition hover:bg-skin-dark active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "채팅방 여는 중… 🍠" : "💬 채팅하기"}
    </button>
  );
}
