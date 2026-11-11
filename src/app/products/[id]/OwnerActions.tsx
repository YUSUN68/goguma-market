"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deleteProduct, updateStatus } from "../actions";
import { STATUSES, type ProductStatus } from "@/lib/products";

// 내가 올린 물건일 때만 보이는 버튼들: 거래 상태 바꾸기, 삭제
export default function OwnerActions({ id, status }: { id: number; status: ProductStatus }) {
  const [pending, startTransition] = useTransition();

  function onStatus(next: ProductStatus) {
    if (next === status) return;
    startTransition(() => updateStatus(id, next));
  }

  function onDelete() {
    if (!confirm("정말 삭제할까요? 사진도 함께 지워지고 되돌릴 수 없어요.")) return;
    startTransition(() => deleteProduct(id));
  }

  return (
    <div className={`space-y-3 ${pending ? "pointer-events-none opacity-60" : ""}`}>
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-cream p-1.5" role="radiogroup" aria-label="거래 상태">
        {(Object.keys(STATUSES) as ProductStatus[]).map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={s === status}
            onClick={() => onStatus(s)}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${
              s === status ? "bg-white text-skin shadow-card" : "text-ink-soft hover:text-ink"
            }`}
          >
            {STATUSES[s].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/products/${id}/edit`}
          className="rounded-2xl bg-skin py-3 text-center text-sm font-bold text-white transition hover:bg-skin-dark"
        >
          수정하기
        </Link>
        <button
          onClick={onDelete}
          className="rounded-2xl border border-line py-3 text-sm font-semibold text-ink-soft transition hover:border-red-300 hover:text-red-600"
        >
          삭제하기
        </button>
      </div>
    </div>
  );
}
