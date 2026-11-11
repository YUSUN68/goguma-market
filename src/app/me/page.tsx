import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLikedProducts, getProductsBySeller } from "@/lib/queries";
import { STATUSES, type ProductStatus } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import { GogumaIcon } from "@/components/Logo";
import NicknameForm from "./NicknameForm";

export const metadata: Metadata = { title: "나의 고구마 | 고구마마켓" };

type SearchParams = PageProps<"/me">["searchParams"];

// 로그인 안 한 사람은 proxy.ts가 로그인 화면으로 보내요
export default function MyPage({ searchParams }: PageProps<"/me">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-cream-deep" />}>
        <MyContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MyContent({ searchParams }: { searchParams: SearchParams }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/me");

  const { status, tab } = await searchParams;
  const selected = typeof status === "string" && status in STATUSES ? (status as ProductStatus) : undefined;
  const showLikes = tab === "likes";

  const [all, liked] = await Promise.all([getProductsBySeller(me.id), getLikedProducts(me.id)]);
  const count = (s: ProductStatus) => all.filter((p) => p.status === s).length;
  const products = selected ? all.filter((p) => p.status === selected) : all;
  // eslint-disable-next-line react-hooks/purity -- 서버에서 요청마다 한 번 계산하는 현재 시각
  const now = Date.now();
  const joined = new Date(me.joinedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  return (
    <>
      {/* 프로필 카드 */}
      <section className="animate-pop-in rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-skin-soft">
            <GogumaIcon className="h-11 w-11" />
          </div>
          <div className="min-w-0 flex-1">
            <NicknameForm nickname={me.nickname} />
            <p className="mt-1 truncate text-sm text-ink-soft">
              {me.email} · {joined} 가입
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
          {(Object.keys(STATUSES) as ProductStatus[]).map((s) => (
            <div key={s} className="rounded-2xl bg-cream py-3">
              <dt className="text-xs font-semibold text-ink-soft">{STATUSES[s].label}</dt>
              <dd className="mt-0.5 text-xl font-extrabold text-skin">{count(s)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 큰 탭: 판매 목록 / 찜한 물건 */}
      <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-5" aria-label="마이페이지 메뉴">
          <BigTab href="/me" active={!showLikes}>
            내 판매 목록
          </BigTab>
          <BigTab href="/me?tab=likes" active={showLikes}>
            찜한 물건 <span className="text-rose-500">♥ {liked.length}</span>
          </BigTab>
        </nav>
        <Link
          href="/products/new"
          className="rounded-full bg-skin px-4 py-2 text-sm font-bold text-white shadow-card transition hover:bg-skin-dark"
        >
          + 판매하기
        </Link>
      </div>

      {showLikes ? (
        <section>
          {liked.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {liked.map((p) => (
                <ProductCard key={p.id} product={p} now={now} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-12 text-center text-sm text-ink-soft">
              아직 찜한 물건이 없어요. 마음에 드는 물건에 ♥를 눌러 보세요!
            </div>
          )}
        </section>
      ) : (
      <section>
        <nav className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4" aria-label="거래 상태">
          <Tab href="/me" active={!selected}>
            전체 {all.length}
          </Tab>
          {(Object.keys(STATUSES) as ProductStatus[]).map((s) => (
            <Tab key={s} href={`/me?status=${s}`} active={selected === s}>
              {STATUSES[s].label} {count(s)}
            </Tab>
          ))}
        </nav>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} now={now} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-12 text-center text-sm text-ink-soft">
            {selected ? `${STATUSES[selected].label}인 물건이 없어요.` : "아직 올린 물건이 없어요. 첫 물건을 올려 보세요! 🍠"}
          </div>
        )}
      </section>
      )}
    </>
  );
}

function BigTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`border-b-2 pb-1 text-lg font-extrabold transition ${
        active ? "border-skin text-ink" : "border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active ? "border-skin bg-skin text-white" : "border-line bg-white text-ink-soft hover:border-skin hover:text-skin"
      }`}
    >
      {children}
    </Link>
  );
}
