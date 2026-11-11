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
        <p className="mt-1 truncate text-xs text-ink-soft">
          {product.seller?.nickname ?? "알 수 없음"} · {timeAgo(product.created_at, now)}
        </p>
      </div>
    </Link>
  );
}
