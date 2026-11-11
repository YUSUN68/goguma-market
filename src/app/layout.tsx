import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "고구마마켓 — 우리 동네 따끈한 중고거래",
  description: "고구마처럼 따끈하고 달달한 동네 중고거래, 고구마마켓",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* 2030이 좋아하는 깔끔한 한글 폰트, Pretendard */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-ink-soft">
          © 고구마마켓 · 따끈하게 사고팔기 🍠
        </footer>
      </body>
    </html>
  );
}
