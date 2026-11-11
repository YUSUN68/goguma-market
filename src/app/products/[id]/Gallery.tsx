"use client";

import { useRef, useState } from "react";
import Image from "next/image";

// 옆으로 넘기는 사진 슬라이드 (CSS scroll-snap 사용)
export default function Gallery({ urls, title }: { urls: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(i: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  if (urls.length === 0) {
    return <div className="flex aspect-[4/3] items-center justify-center bg-cream-deep text-6xl">🍠</div>;
  }

  return (
    <div className="relative">
      <div
        ref={track}
        onScroll={onScroll}
        className="flex aspect-square snap-x snap-mandatory overflow-x-auto bg-cream-deep [scrollbar-width:none] sm:aspect-[4/3]"
      >
        {urls.map((url, i) => (
          <div key={url} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={url}
              alt={`${title} 사진 ${i + 1}`}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {urls.length > 1 && (
        <>
          <button
            onClick={() => go(Math.max(0, index - 1))}
            aria-label="이전 사진"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg shadow backdrop-blur sm:flex"
          >
            ‹
          </button>
          <button
            onClick={() => go(Math.min(urls.length - 1, index + 1))}
            aria-label="다음 사진"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg shadow backdrop-blur sm:flex"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {urls.map((url, i) => (
              <button
                key={url}
                onClick={() => go(i)}
                aria-label={`${i + 1}번째 사진`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-2 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
