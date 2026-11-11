import { Suspense } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { hasUnreadNotifications } from "@/lib/chat";
import HeaderIcons from "./HeaderIcons";

// 헤더 틀(로고)은 바로 그리고, 로그인 상태에 따라 바뀌는 오른쪽만 나중에 채워요
export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Logo />
        <Suspense fallback={<div className="h-9 w-36 animate-pulse rounded-full bg-cream-deep" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function UserMenu() {
  const me = await getCurrentUser();

  if (!me) {
    return (
      <nav className="flex items-center gap-1.5">
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:text-skin"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-skin px-4 py-2 text-sm font-bold text-white shadow-card transition hover:bg-skin-dark"
        >
          회원가입
        </Link>
      </nav>
    );
  }

  const unread = await hasUnreadNotifications();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href="/products/new"
        title="판매하기"
        className="rounded-full bg-skin shrink-0 px-3 py-1.5 sm:py-2 text-sm font-bold text-white shadow-card transition hover:bg-skin-dark sm:px-4"
      >
        +<span className="hidden sm:inline"> 판매하기</span>
      </Link>
      <HeaderIcons userId={me.id} initialUnread={unread} />
      <Link
        href="/me"
        title="나의 고구마"
        className="rounded-full bg-skin-soft shrink-0 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm font-semibold text-skin transition hover:bg-skin hover:text-white"
      >
        🍠<span className="hidden sm:inline"> {me.nickname}님</span>
      </Link>
      <form action={logout}>
        <button className="rounded-full border border-line bg-white shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-ink-soft transition hover:border-skin hover:text-skin">
          로그아웃
        </button>
      </form>
    </div>
  );
}
