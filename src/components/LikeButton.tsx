"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { toggleLike } from "@/app/products/actions";

type Props = {
  productId: number;
  liked: boolean;
  count: number;
  loggedIn: boolean;
};

// 하트 버튼. 서버 응답을 기다리지 않고 바로 색이 바뀌어요 (useOptimistic)
export default function LikeButton({ productId, liked, count, loggedIn }: Props) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic({ liked, count });

  const className =
    "flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-2xl border border-line bg-white text-xs font-bold transition active:scale-95";

  // 로그인 안 했으면 누르는 순간 로그인 화면으로
  if (!loggedIn) {
    return (
      <Link href={`/login?next=/products/${productId}`} className={`${className} text-ink-soft`} aria-label="좋아요 (로그인 필요)">
        <Heart filled={false} />
        {count > 0 && <span>{count}</span>}
      </Link>
    );
  }

  function onClick() {
    startTransition(async () => {
      setOptimistic({
        liked: !optimistic.liked,
        count: optimistic.count + (optimistic.liked ? -1 : 1),
      });
      await toggleLike(productId, optimistic.liked);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic.liked}
      aria-label={optimistic.liked ? "좋아요 취소" : "좋아요"}
      className={`${className} ${optimistic.liked ? "border-rose-200 bg-rose-50 text-rose-500" : "text-ink-soft hover:text-rose-500"}`}
    >
      <Heart filled={optimistic.liked} />
      {optimistic.count > 0 && <span>{optimistic.count}</span>}
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${filled ? "animate-pop-in" : ""}`} aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
