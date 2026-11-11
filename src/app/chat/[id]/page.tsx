import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMessages, getRoom } from "@/lib/chat";
import { STATUSES, formatPrice, imageUrl, type ProductStatus } from "@/lib/products";
import ChatRoom from "./ChatRoom";

export const metadata: Metadata = { title: "채팅 | 고구마마켓" };

type Params = PageProps<"/chat/[id]">["params"];

export default function ChatRoomPage({ params }: PageProps<"/chat/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4 sm:py-8">
      <Link href="/chat" className="mb-3 inline-block text-sm font-semibold text-ink-soft hover:text-skin">
        ← 채팅 목록
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-cream-deep" />}>
        <RoomContent params={params} />
      </Suspense>
    </div>
  );
}

async function RoomContent({ params }: { params: Params }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=/chat/${id}`);

  // RLS 때문에 내가 참여하지 않은 방은 null로 와요 → 404
  const [room, messages] = await Promise.all([getRoom(id), getMessages(id)]);
  if (!room) notFound();

  const iAmSeller = room.seller_id === me.id;
  const other = (iAmSeller ? room.buyer : room.seller)?.nickname ?? "알 수 없음";
  const product = room.product;
  const status = product ? STATUSES[product.status as ProductStatus] : null;

  return (
    <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      {/* 위: 상대방 + 어떤 물건 이야기인지 */}
      <header className="border-b border-line p-4">
        <p className="font-bold">
          {other} <span className="text-xs font-normal text-ink-soft">{iAmSeller ? "· 구매 문의" : "· 판매자"}</span>
        </p>
        {product && (
          <Link
            href={`/products/${room.product_id}`}
            className="mt-3 flex items-center gap-3 rounded-2xl bg-cream p-2 transition hover:bg-cream-deep"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
              {product.image_paths[0] && (
                <Image src={imageUrl(product.image_paths[0])} alt="" fill sizes="44px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">
                {status && (
                  <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${status.className}`}>
                    {status.label}
                  </span>
                )}
                {product.title}
              </p>
              <p className="font-bold text-skin">{formatPrice(product.price)}</p>
            </div>
          </Link>
        )}
      </header>

      <ChatRoom
        roomId={room.id}
        myId={me.id}
        otherName={other}
        iAmSeller={iAmSeller}
        initialOtherReadAt={iAmSeller ? room.buyer_last_read_at : room.seller_last_read_at}
        initialMessages={messages}
      />
    </section>
  );
}
