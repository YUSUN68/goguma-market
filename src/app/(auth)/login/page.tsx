import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인 | 고구마마켓" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="text-center text-2xl font-extrabold text-ink">다시 만나 반가워요!</h1>
      <p className="mb-6 mt-1 text-center text-sm text-ink-soft">
        따끈한 거래가 기다리고 있어요 🔥
      </p>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-cream" />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// URL의 ?next=, ?error= 를 읽어서 폼에 넘겨줘요
async function LoginFormWithParams({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/";
  const initialError =
    error === "confirm" ? "인증 링크가 만료됐거나 잘못됐어요. 다시 시도해 주세요." : undefined;
  return <LoginForm next={nextPath} initialError={initialError} />;
}
