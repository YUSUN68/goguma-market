"use client";

import { useActionState, useState } from "react";
import { updateNickname, type NicknameState } from "./actions";

// 닉네임 옆 ✏️ 버튼을 누르면 입력칸으로 바뀌어요
export default function NicknameForm({ nickname }: { nickname: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<NicknameState, FormData>(
    async (prev, formData) => {
      const result = await updateNickname(prev, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    {},
  );

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-extrabold">{nickname}</h1>
        <button
          onClick={() => setEditing(true)}
          className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-skin hover:text-skin"
        >
          ✏️ 닉네임 수정
        </button>
        {state.ok && <span className="animate-pop-in text-xs font-semibold text-skin">저장했어요!</span>}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="nickname"
          defaultValue={state.nickname ?? nickname}
          minLength={2}
          maxLength={12}
          required
          autoFocus
          aria-label="새 닉네임"
          className="w-full min-w-0 rounded-xl border border-line bg-cream px-3 py-2 font-bold outline-none focus:border-skin focus:bg-white focus:ring-4 focus:ring-skin/10"
        />
        <button
          disabled={pending}
          className="shrink-0 rounded-xl bg-skin px-4 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="shrink-0 rounded-xl border border-line px-3 text-sm font-semibold text-ink-soft"
        >
          취소
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
