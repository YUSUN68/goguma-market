import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getProducts } from "@/lib/queries";
import { CATEGORIES, categoryOf, isCategory } from "@/lib/products";
import { GogumaIcon } from "@/components/Logo";
import ProductCard from "@/components/ProductCard";

type SearchParams = PageProps<"/">["searchParams"];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={null}>
        <WelcomeBanner searchParams={searchParams} />
      </Suspense>

      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-[2rem] bg-skin px-6 py-10 text-white shadow-card sm:px-10 sm:py-14">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-flesh/30 blur-2xl" />
        <div className="relative max-w-md">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            우리 동네 중고거래
          </p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            안 쓰는 물건,
            <br />
            <span className="text-flesh">따끈하게</span> 팔아봐요
          </h1>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            고구마처럼 달달한 동네 이웃과의 거래. 가까워서 더 믿을 수 있어요.
          </p>
          <div className="mt-6 flex min-h-11 flex-wrap gap-2">
            <Suspense fallback={null}>
              <HeroActions />
            </Suspense>
          </div>
        </div>
        <GogumaIcon className="animate-wiggle absolute -bottom-4 right-4 hidden h-40 w-40 sm:block" />
      </section>

      {/* 카테고리 + 상품 목록 (URL의 ?category= 로 걸러요) */}
      <Suspense fallback={<ListSkeleton />}>
        <ProductSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductSection({ searchParams }: { searchParams: SearchParams }) {
  const { category } = await searchParams;
  const selected = isCategory(category) ? category : undefined;
  const products = await getProducts(selected);
  // eslint-disable-next-line react-hooks/purity -- 서버에서 요청마다 한 번 계산하는 현재 시각
  const now = Date.now();

  return (
    <>
      <nav className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2" aria-label="카테고리">
        <CategoryChip href="/" active={!selected}>
          🔥 전체
        </CategoryChip>
        {CATEGORIES.map((c) => (
          <CategoryChip key={c.id} href={`/?category=${c.id}`} active={selected === c.id}>
            {c.emoji} {c.label}
          </CategoryChip>
        ))}
      </nav>

      <section className="mt-6">
        <h2 className="mb-4 text-lg font-extrabold">
          {selected ? `${categoryOf(selected).label} 물건` : "방금 올라온 물건"}
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} now={now} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
            <GogumaIcon className="mx-auto mb-3 h-14 w-14 opacity-80" />
            <p className="font-semibold">아직 올라온 물건이 없어요</p>
            <p className="mt-1 text-sm text-ink-soft">첫 번째 판매자가 되어 보세요!</p>
            <Link
              href="/products/new"
              className="mt-5 inline-block rounded-full bg-skin px-5 py-2.5 text-sm font-bold text-white"
            >
              + 내 물건 팔기
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

function CategoryChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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

function ListSkeleton() {
  return (
    <section className="mt-8">
      <div className="mb-6 h-10 w-full animate-pulse rounded-full bg-cream-deep" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-3xl border border-line bg-white p-2.5">
            <div className="aspect-square rounded-2xl bg-cream-deep" />
            <div className="mt-3 h-3 w-3/4 rounded-full bg-cream-deep" />
            <div className="mt-2 h-3 w-1/2 rounded-full bg-flesh-soft" />
          </div>
        ))}
      </div>
    </section>
  );
}

// 가입 직후(?welcome=1)에만 보이는 환영 메시지
async function WelcomeBanner({ searchParams }: { searchParams: SearchParams }) {
  const { welcome } = await searchParams;
  if (!welcome) return null;
  const me = await getCurrentUser();
  if (!me) return null;
  return (
    <div className="animate-pop-in mb-6 rounded-2xl border border-flesh bg-flesh-soft px-5 py-3 text-sm font-semibold text-skin-dark">
      🎉 {me.nickname}님, 환영해요! 이제 고구마마켓에서 따끈하게 거래해 보세요.
    </div>
  );
}

async function HeroActions() {
  const me = await getCurrentUser();
  if (me) {
    return (
      <Link
        href="/products/new"
        className="rounded-full bg-flesh px-5 py-3 text-sm font-bold text-ink transition hover:brightness-105"
      >
        🍠 내 물건 팔기
      </Link>
    );
  }
  return (
    <>
      <Link
        href="/signup"
        className="rounded-full bg-flesh px-5 py-3 text-sm font-bold text-ink transition hover:brightness-105"
      >
        지금 시작하기
      </Link>
      <Link
        href="/login"
        className="rounded-full bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/25"
      >
        로그인
      </Link>
    </>
  );
}
