import type { Metadata } from "next";
import ProductForm from "@/components/ProductForm";
import { createProduct } from "../actions";

export const metadata: Metadata = { title: "내 물건 팔기 | 고구마마켓" };

// 로그인 안 한 사람은 proxy.ts가 로그인 화면으로 보내요
export default function NewProductPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">내 물건 팔기 🍠</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">사진과 설명을 올리면 동네 이웃이 볼 수 있어요.</p>
      <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
        <ProductForm action={createProduct} submitLabel="등록하기" />
      </div>
    </div>
  );
}
