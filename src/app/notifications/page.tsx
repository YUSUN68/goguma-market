import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getNotifications, type Notification } from "@/lib/chat";
import { imageUrl, timeAgo } from "@/lib/products";
import MarkAllRead from "./MarkAllRead";

export const metadata: Metadata = { title: "알림 | 고구마마켓" };

// 로그인 안 한 사람은 proxy.ts가 로그인 화면으로 보내요
export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="mb-5 text-2xl font-extrabold">🔔 알림</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl bg-cream-deep" />}>
        <NotificationList />
      </Suspense>
    </div>
  );
}

async function NotificationList() {
  const items = await getNotifications();
  // eslint-disable-next-line react-hooks/purity -- 서버에서 요청마다 한 번 계산하는 현재 시각
  const now = Date.now();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center text-ink-soft">
        <p className="text-4xl">🔔</p>
        <p className="mt-3 font-semibold">아직 알림이 없어요</p>
        <p className="mt-1 text-sm">누가 내 물건을 찜하거나 채팅을 보내면 여기에 모여요.</p>
      </div>
    );
  }

  return (
    <>
      <MarkAllRead />
      <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        {items.map((n) => (
          <li key={n.id}>
            <NotificationItem n={n} now={now} />
          </li>
        ))}
      </ul>
    </>
  );
}

function NotificationItem({ n, now }: { n: Notification; now: number }) {
  const actor = n.actor?.nickname ?? "누군가";
  const title = n.product?.title ?? "삭제된 물건";
  const cover = n.product?.image_paths[0];
  const isNew = !n.read_at;
  // 채팅 알림은 채팅방으로, 좋아요 알림은 상품으로 이동해요
  const href = n.type === "chat" && n.room_id ? `/chat/${n.room_id}` : `/products/${n.product_id}`;

  return (
    <Link href={href} className={`flex items-center gap-3 p-4 transition hover:bg-cream ${isNew ? "bg-skin-soft/40" : ""}`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          n.type === "like" ? "bg-rose-50 text-rose-500" : "bg-skin-soft"
        }`}
        aria-hidden="true"
      >
        {n.type === "like" ? "♥" : "💬"}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        {n.type === "like" ? (
          <p>
            <b>{actor}</b>님이 <b>{title}</b>을(를) 좋아해요
          </p>
        ) : (
          <>
            <p>
              <b>{actor}</b>님이 채팅을 보냈어요 <span className="text-ink-soft">· {title}</span>
            </p>
            {n.body && <p className="mt-0.5 truncate text-ink/80">&ldquo;{n.body}&rdquo;</p>}
          </>
        )}
        <p className="mt-0.5 text-xs text-ink-soft">
          {timeAgo(n.created_at, now)}
          {isNew && <span className="ml-1.5 font-bold text-red-500">새 알림</span>}
        </p>
      </div>
      {cover && (
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
          <Image src={imageUrl(cover)} alt="" fill sizes="44px" className="object-cover" />
        </div>
      )}
    </Link>
  );
}
