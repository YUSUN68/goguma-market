import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import ProductForm from "@/components/ProductForm";
import { updateProduct } from "../../actions";

export const metadata: Metadata = { title: "상품 수정 | 고구마마켓" };

type Params = PageProps<"/products/[id]/edit">["params"];

export default function EditProductPage({ params }: PageProps<"/products/[id]/edit">) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">상품 수정 ✏️</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">바뀐 내용만 고치고 저장하면 돼요.</p>
      <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-cream" />}>
          <EditForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditForm({ params }: { params: Params }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [product, me] = await Promise.all([getProduct(id), getCurrentUser()]);
  // 남의 상품이면 "없는 페이지"로 보여요 (실제 수정은 서버 액션과 RLS가 한 번 더 막아요)
  if (!product || product.seller_id !== me?.id) notFound();

  return (
    <ProductForm
      action={updateProduct.bind(null, id)}
      submitLabel="수정 완료"
      initial={{
        title: product.title,
        price: product.price,
        category: product.category,
        description: product.description,
        imagePaths: product.image_paths,
      }}
    />
  );
}
