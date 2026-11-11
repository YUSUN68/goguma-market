import Image from "next/image";
import Link from "next/link";
import { STATUSES, formatPrice, imageUrl, timeAgo, type Product } from "@/lib/products";

export default function ProductCard({ product, now }: { product: Product; now: number }) {
  const status = STATUSES[product.status];
  const cover = product.image_paths[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-3xl border border-line bg-white p-2.5 transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-deep">
        {cover ? (
          <Image
            src={imageUrl(cover)}
            alt={product.title}
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className={`object-cover transition duration-300 group-hover:scale-105 ${
              product.status === "sold" ? "opacity-50 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🍠</div>
        )}
        {product.status !== "selling" && (
          <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>
      <div className="px-1 pb-1 pt-2.5">
        <h3 className="truncate text-[15px] font-semibold">{product.title}</h3>
        <p className="mt-0.5 font-extrabold text-skin">{formatPrice(product.price)}</p>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-ink-soft">
          <p className="truncate">
            {product.seller?.nickname ?? "알 수 없음"} · {timeAgo(product.created_at, now)}
          </p>
          {/* 0이면 숨겨요. 좋아요(♥)와 채팅(💬) 수를 나란히 보여줘요 */}
          {(product.like_count > 0 || product.chat_count > 0) && (
            <span className="flex shrink-0 items-center gap-1.5 font-semibold">
              {product.chat_count > 0 && (
                <span className="flex items-center gap-0.5 text-ink-soft" aria-label={`채팅 ${product.chat_count}개`}>
                  <ChatIcon />
                  {product.chat_count}
                </span>
              )}
              {product.like_count > 0 && (
                <span className="text-rose-500" aria-label={`좋아요 ${product.like_count}개`}>
                  ♥ {product.like_count}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// 헤더의 채팅 아이콘과 같은 말풍선 모양 (글자 크기에 맞춘 작은 버전)
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path strokeLinejoin="round" d="M4 5h16v11H9l-5 4V5Z" />
    </svg>
  );
}
