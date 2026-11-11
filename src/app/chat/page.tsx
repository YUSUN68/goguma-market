import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyRooms, getUnreadRoomIds } from "@/lib/chat";
import { imageUrl, timeAgo } from "@/lib/products";

export const metadata: Metadata = { title: "채팅 | 고구마마켓" };

export default function ChatListPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="mb-5 text-2xl font-extrabold">💬 채팅</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl bg-cream-deep" />}>
        <RoomList />
      </Suspense>
    </div>
  );
}

async function RoomList() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/chat");

  const [rooms, unread] = await Promise.all([getMyRooms(), getUnreadRoomIds()]);
  // eslint-disable-next-line react-hooks/purity -- 서버에서 요청마다 한 번 계산하는 현재 시각
  const now = Date.now();

  if (rooms.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center text-ink-soft">
        <p className="text-4xl">🍠</p>
        <p className="mt-3 font-semibold">아직 채팅이 없어요</p>
        <p className="mt-1 text-sm">마음에 드는 물건에서 &lsquo;채팅하기&rsquo;를 눌러 보세요.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      {rooms.map((room) => {
        const iAmSeller = room.seller_id === me.id;
        const other = (iAmSeller ? room.buyer : room.seller)?.nickname ?? "알 수 없음";
        const cover = room.product?.image_paths[0];
        const isNew = unread.has(room.id);
        return (
          <li key={room.id}>
            <Link href={`/chat/${room.id}`} className="flex items-center gap-3 p-4 transition hover:bg-cream">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream-deep">
                {cover && <Image src={imageUrl(cover)} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm">
                  <span className="font-bold">{other}</span>
                  <span className="rounded-full bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                    {iAmSeller ? "구매 문의" : "판매자"}
                  </span>
                  {room.last_message_at && (
                    <span className="text-xs text-ink-soft">· {timeAgo(room.last_message_at, now)}</span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-soft">{room.product?.title}</p>
                <p className={`mt-0.5 truncate text-sm ${isNew ? "font-bold text-ink" : "text-ink/80"}`}>
                  {room.last_message ?? "아직 대화가 없어요"}
                </p>
              </div>
              {isNew && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-label="새 메시지" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
