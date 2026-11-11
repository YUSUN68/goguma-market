import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, isLikedByMe } from "@/lib/queries";
import LikeButton from "@/components/LikeButton";
import { getCurrentUser } from "@/lib/auth";
import { STATUSES, categoryOf, formatPrice, imageUrl, timeAgo } from "@/lib/products";
import Gallery from "./Gallery";
import OwnerActions from "./OwnerActions";
import { startChat } from "@/app/chat/actions";
import ChatButton from "./ChatButton";

type Params = PageProps<"/products/[id]">["params"];

function parseId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = parseId((await params).id);
  const product = id ? await getProduct(id) : null;
  return { title: product ? `${product.title} | 고구마마켓` : "고구마마켓" };
}

// 주소의 [id]는 요청 때마다 달라지니까 Suspense 안에서 읽어요
export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Link href="/" className="mb-4 inline-block text-sm font-semibold text-ink-soft hover:text-skin">
        ← 목록으로
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const [product, me] = await Promise.all([getProduct(id), getCurrentUser()]);
  if (!product) notFound();

  const liked = await isLikedByMe(product.id, me?.id);
  const isMine = me?.id === product.seller_id;
  const status = STATUSES[product.status];
  const category = categoryOf(product.category);

  return (
    <article className="animate-pop-in overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <Gallery urls={product.image_paths.map(imageUrl)} title={product.title} />

      <div className="p-5 sm:p-8">
        {/* 판매자 */}
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-skin-soft text-xl">🍠</div>
          <div>
            <p className="font-bold">{product.seller?.nickname ?? "알 수 없음"}</p>
            <p className="text-xs text-ink-soft">{isMine ? "내가 올린 물건이에요" : "동네 이웃"}</p>
          </div>
        </div>

        {/* 본문 */}
        <div className="py-5">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
            <Link
              href={`/?category=${category.id}`}
              className="text-xs font-semibold text-ink-soft underline-offset-2 hover:underline"
            >
              {category.emoji} {category.label}
            </Link>
            <span className="text-xs text-ink-soft">· {timeAgo(product.created_at)}</span>
            {isMine && product.like_count > 0 && (
              <span className="text-xs font-semibold text-rose-500">· ♥ {product.like_count}명이 좋아해요</span>
            )}
            {isMine && product.chat_count > 0 && (
              <span className="text-xs font-semibold text-ink-soft">· 💬 채팅 {product.chat_count}개</span>
            )}
          </div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{product.title}</h1>
          <p className="mt-1 text-2xl font-extrabold text-skin">{formatPrice(product.price)}</p>
          {product.description ? (
            <p className="mt-5 whitespace-pre-wrap leading-relaxed text-ink/90">{product.description}</p>
          ) : (
            <p className="mt-5 text-sm text-ink-soft">설명이 없어요.</p>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="border-t border-line pt-5">
          {isMine ? (
            <OwnerActions id={product.id} status={product.status} />
          ) : (
            <div className="flex gap-2">
              <LikeButton
                productId={product.id}
                liked={liked}
                count={product.like_count}
                loggedIn={!!me}
              />
              {me ? (
                // 서버 액션에 상품 id를 미리 묶어서(bind) 넘겨요
                <form action={startChat.bind(null, product.id)} className="flex-1">
                  <ChatButton />
                </form>
              ) : (
                <Link
                  href={`/login?next=/products/${product.id}`}
                  className="flex-1 rounded-2xl bg-skin py-3.5 text-center font-bold text-white transition hover:bg-skin-dark"
                >
                  💬 채팅하기
                </Link>
              )}
            </div>
          )}
          {isMine && (
            <Link href="/chat" className="mt-3 block text-center text-sm font-semibold text-ink-soft hover:text-skin">
              💬 이 물건에 온 채팅은 채팅 목록에서 볼 수 있어요 →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-line bg-white">
      <div className="aspect-square bg-cream-deep sm:aspect-[4/3]" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-1/3 rounded-full bg-cream-deep" />
        <div className="h-6 w-2/3 rounded-full bg-cream-deep" />
        <div className="h-6 w-1/4 rounded-full bg-flesh-soft" />
      </div>
    </div>
  );
}
