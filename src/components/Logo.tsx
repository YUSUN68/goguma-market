import Link from "next/link";

// 고구마 모양 SVG 아이콘
export function GogumaIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* 잎 */}
      <path d="M44 10c4-6 12-6 14-4-2 6-8 9-13 9" fill="#6fbf73" />
      <path d="M42 12c0-6 4-10 8-11 1 5-2 10-6 13" fill="#4f9f57" />
      {/* 껍질 */}
      <path
        d="M14 50C4 40 8 22 24 15c12-5 24-1 26 9 3 14-10 30-24 31-5 0-9-2-12-5Z"
        fill="#8b3a62"
      />
      {/* 속살 (한 입 베어 문 부분) */}
      <path
        d="M14 50c-3-3-4-8-1-11 4-3 9-2 12 1s4 9 1 12c-3 2-8 2-12-2Z"
        fill="#ffb84d"
      />
      {/* 하이라이트 */}
      <path d="M28 21c5-2 11-2 14 1" stroke="#b9618a" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* 얼굴 */}
      <circle cx="30" cy="33" r="2.2" fill="#2e1a24" />
      <circle cx="40" cy="31" r="2.2" fill="#2e1a24" />
      <path d="M33 38c2 2 4 2 6 0" stroke="#2e1a24" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="38" r="2.5" fill="#ff8fab" opacity="0.6" />
      <circle cx="45" cy="35" r="2.5" fill="#ff8fab" opacity="0.6" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-1 sm:gap-1.5">
      <GogumaIcon className="h-8 w-8 transition-transform group-hover:-rotate-12 sm:h-9 sm:w-9" />
      <span className="text-lg font-extrabold tracking-tight text-skin sm:text-xl">
        고구마<span className="text-flesh">마켓</span>
      </span>
    </Link>
  );
}
