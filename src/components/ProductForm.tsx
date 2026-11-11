"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ProductFormState } from "@/app/products/actions";
import { CATEGORIES, MAX_IMAGES, imageUrl } from "@/lib/products";
import { resizeImage } from "@/lib/resize-image";
import FormField, { Alert, RequiredMark, SubmitButton } from "@/components/FormField";

// 사진 한 칸: 이미 올라가 있던 사진(existing) 또는 새로 고른 사진(new)
type Slot =
  | { kind: "existing"; path: string; preview: string }
  | { kind: "new"; file: File; preview: string };

export type ProductFormInitial = {
  title: string;
  price: number;
  category: string;
  description: string;
  imagePaths: string[];
};

type Props = {
  // 등록이면 createProduct, 수정이면 updateProduct.bind(null, id)
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initial?: ProductFormInitial;
  submitLabel: string;
};

export default function ProductForm({ action, initial, submitLabel }: Props) {
  const [slots, setSlots] = useState<Slot[]>(
    () => initial?.imagePaths.map((path) => ({ kind: "existing", path, preview: imageUrl(path) })) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(initial ? initial.price.toLocaleString("ko-KR") : "");
  const fileInput = useRef<HTMLInputElement>(null);

  // 폼을 보낼 때 사진 순서(slots)와 새 사진 파일들을 FormData에 붙여서 서버 액션으로 넘겨요
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    async (prev, formData) => {
      formData.delete("slots");
      formData.delete("images");
      for (const s of slots) {
        if (s.kind === "existing") formData.append("slots", `keep:${s.path}`);
        else {
          formData.append("slots", "new");
          formData.append("images", s.file);
        }
      }
      formData.set("price", price.replaceAll(",", ""));
      return action(prev, formData);
    },
    {},
  );

  // 새 사진 미리보기용 임시 URL은 화면을 떠날 때 정리해요 (메모리 누수 방지)
  const latest = useRef(slots);
  useEffect(() => {
    latest.current = slots;
  }, [slots]);
  useEffect(
    () => () =>
      latest.current.forEach((s) => s.kind === "new" && URL.revokeObjectURL(s.preview)),
    [],
  );

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - slots.length);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    try {
      const resized = await Promise.all(files.map((f) => resizeImage(f)));
      setSlots((prev) => [
        ...prev,
        ...resized.map((file) => ({ kind: "new" as const, file, preview: URL.createObjectURL(file) })),
      ]);
    } finally {
      setBusy(false);
    }
  }

  function removeSlot(index: number) {
    const s = slots[index];
    if (s.kind === "new") URL.revokeObjectURL(s.preview);
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  // 누른 사진을 맨 앞(대표 사진)으로 옮겨요
  function makeCover(index: number) {
    setSlots((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  }

  function onPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPrice(digits ? Number(digits).toLocaleString("ko-KR") : "");
  }

  const values = state.fields ?? {
    title: initial?.title,
    category: initial?.category,
    description: initial?.description,
  };
  const inputClass =
    "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-[15px] outline-none transition placeholder:text-ink-soft/60 focus:border-skin focus:bg-white focus:ring-4 focus:ring-skin/10";

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-right text-xs text-ink-soft">
        <span className="text-red-500">*</span> 표시는 꼭 입력해야 해요
      </p>

      {/* 사진 (1장 이상인지는 서버 액션에서 확인해요) */}
      <div>
        <p className="mb-2 text-sm font-semibold">
          사진
          <RequiredMark /> <span className="text-ink-soft">({slots.length}/{MAX_IMAGES})</span>
          {slots.length > 1 && (
            <span className="ml-2 text-xs font-normal text-ink-soft">사진을 누르면 대표 사진이 돼요</span>
          )}
        </p>
        <div className="-ml-1 flex gap-3 overflow-x-auto overflow-y-hidden pb-2 pl-1 pr-2 pt-2">
          {slots.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-cream text-ink-soft transition hover:border-skin hover:text-skin disabled:opacity-60"
            >
              <span className="text-2xl">{busy ? "⏳" : "📷"}</span>
              <span className="text-xs font-semibold">{busy ? "줄이는 중" : "사진 추가"}</span>
            </button>
          )}
          {slots.map((s, i) => (
            <div key={s.preview} className="relative h-24 w-24 shrink-0">
              <button type="button" onClick={() => makeCover(i)} className="h-full w-full" aria-label="대표 사진으로">
                {/* 미리보기라 next/image 대신 img를 써요 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.preview}
                  alt=""
                  className={`h-full w-full rounded-2xl object-cover ${i === 0 ? "ring-2 ring-skin ring-offset-2" : ""}`}
                />
              </button>
              {i === 0 && (
                <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-skin px-2 py-0.5 text-[10px] font-bold text-white">
                  대표
                </span>
              )}
              <button
                type="button"
                onClick={() => removeSlot(i)}
                aria-label="사진 삭제"
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={onPick}
        />
      </div>

      <FormField
        label="제목"
        name="title"
        placeholder="예) 아이패드 미니 6세대 팝니다"
        maxLength={40}
        defaultValue={values.title}
        required
      />

      {/* 카테고리 */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          카테고리
          <RequiredMark />
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <label key={c.id} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={c.id}
                defaultChecked={values.category === c.id}
                className="peer sr-only"
                required
              />
              <span className="inline-block rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink-soft transition peer-checked:border-skin peer-checked:bg-skin peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-skin/20">
                {c.emoji} {c.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="price" className="block text-sm font-semibold">
          가격
          <RequiredMark />
        </label>
        <div className="relative">
          <input
            id="price"
            name="price"
            inputMode="numeric"
            placeholder="0이면 나눔이에요"
            value={price}
            onChange={onPriceChange}
            required
            className={`${inputClass} pr-10`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-soft">원</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-semibold">
          자세한 설명
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={values.description}
          placeholder={"브랜드, 사용 기간, 하자 여부 등을 적어 주세요.\n따끈한 설명일수록 빨리 팔려요 🍠"}
          className={`${inputClass} resize-y`}
        />
      </div>

      {state.error && <Alert kind="error">{state.error}</Alert>}

      <SubmitButton pending={pending || busy}>{submitLabel}</SubmitButton>
    </form>
  );
}
