import { GogumaIcon } from "@/components/Logo";

// 로그인·회원가입 화면이 함께 쓰는 카드 레이아웃
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-flesh-soft blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-skin-soft blur-3xl" />

      <div className="animate-pop-in relative w-full max-w-sm rounded-3xl border border-line bg-white p-7 shadow-card sm:p-8">
        <GogumaIcon className="animate-wiggle mx-auto mb-3 h-14 w-14" />
        {children}
      </div>
    </div>
  );
}
