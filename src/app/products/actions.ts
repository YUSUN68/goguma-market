"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IMAGE_BUCKET, MAX_IMAGES, STATUSES, isCategory, type ProductStatus } from "@/lib/products";

export type ProductFormState = {
  error?: string;
  fields?: { title?: string; price?: string; category?: string; description?: string };
};

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * 등록·수정 폼이 함께 쓰는 입력값 읽기 + 검사.
 *
 * 사진 순서는 "slots"로 받아요. 예) ["keep:abc/1.jpg", "new", "keep:abc/2.jpg"]
 *   - keep:<경로>  이미 올라가 있는 사진을 그대로 둬요 (수정할 때만)
 *   - new          새로 고른 사진. "images" 파일 목록에서 순서대로 하나씩 꺼내요
 */
function readForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const priceText = String(formData.get("price") ?? "").replaceAll(",", "").trim();
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const slots = formData.getAll("slots").map(String);
  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const fields = { title, price: priceText, category, description };
  const price = Number(priceText);

  let error: string | undefined;
  if (title.length < 2 || title.length > 40) error = "제목은 2~40자로 써 주세요.";
  else if (!priceText || !Number.isInteger(price) || price < 0 || price > 100_000_000)
    error = "가격은 0원~1억 원 사이 숫자로 써 주세요.";
  else if (!isCategory(category)) error = "카테고리를 골라 주세요.";
  else if (description.length > 2000) error = "설명은 2000자까지 쓸 수 있어요.";
  else if (slots.length === 0) error = "사진을 1장 이상 올려 주세요.";
  else if (slots.length > MAX_IMAGES) error = `사진은 ${MAX_IMAGES}장까지 올릴 수 있어요.`;
  else if (slots.filter((s) => s === "new").length !== files.length)
    error = "사진 정보가 올바르지 않아요. 새로고침 후 다시 시도해 주세요.";
  else if (files.some((f) => !IMAGE_TYPES[f.type] || f.size > 5 * 1024 * 1024))
    error = "사진은 5MB 이하의 JPG·PNG·WEBP만 올릴 수 있어요.";

  return { error, fields, values: { title, price, category, description }, slots, files };
}

// 새 사진들을 Storage에 올리고, slots 순서대로 최종 경로 목록을 만들어요
async function uploadImages(supabase: Supabase, userId: string, slots: string[], files: File[]) {
  const uploaded: string[] = [];
  const paths: string[] = [];
  let next = 0;
  for (const slot of slots) {
    if (slot !== "new") {
      paths.push(slot.slice("keep:".length));
      continue;
    }
    const file = files[next++];
    const path = `${userId}/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (error) {
      await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);
      return { error: `사진 업로드에 실패했어요: ${error.message}` };
    }
    uploaded.push(path);
    paths.push(path);
  }
  return { paths, uploaded };
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/products/new");

  // 브라우저 검사는 우회할 수 있어서 서버에서 한 번 더 검사해요
  const form = readForm(formData);
  if (form.error) return { error: form.error, fields: form.fields };
  if (form.slots.some((s) => s !== "new"))
    return { error: "사진 정보가 올바르지 않아요.", fields: form.fields };

  const up = await uploadImages(supabase, user.id, form.slots, form.files);
  if (up.error) return { error: up.error, fields: form.fields };

  // seller_id는 DB가 auth.uid()로 자동으로 채워요
  const { data, error } = await supabase
    .from("products")
    .insert({ ...form.values, image_paths: up.paths })
    .select("id")
    .single();
  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove(up.uploaded!);
    return { error: `저장에 실패했어요: ${error.message}`, fields: form.fields };
  }

  revalidatePath("/");
  redirect(`/products/${data.id}`);
}

// bind로 id를 미리 넣어서 써요: updateProduct.bind(null, id)
export async function updateProduct(
  id: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${id}/edit`);

  // 내 상품인지 확인하고, 원래 있던 사진 목록을 가져와요
  const { data: product } = await supabase
    .from("products")
    .select("image_paths")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!product) return { error: "내 상품만 수정할 수 있어요." };

  const form = readForm(formData);
  if (form.error) return { error: form.error, fields: form.fields };

  // "keep"으로 온 경로가 정말 이 상품의 사진인지 확인 (남의 사진 경로를 끼워 넣지 못하게)
  const original: string[] = product.image_paths;
  const kept = form.slots.filter((s) => s !== "new").map((s) => s.slice("keep:".length));
  if (kept.some((p) => !original.includes(p)))
    return { error: "사진 정보가 올바르지 않아요.", fields: form.fields };

  const up = await uploadImages(supabase, user.id, form.slots, form.files);
  if (up.error) return { error: up.error, fields: form.fields };

  const { error } = await supabase
    .from("products")
    .update({ ...form.values, image_paths: up.paths })
    .eq("id", id);
  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove(up.uploaded!);
    return { error: `저장에 실패했어요: ${error.message}`, fields: form.fields };
  }

  // 빠진 옛 사진은 Storage에서도 지워요
  const removed = original.filter((p) => !kept.includes(p));
  if (removed.length) await supabase.storage.from(IMAGE_BUCKET).remove(removed);

  revalidatePath("/");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function updateStatus(id: number, status: ProductStatus) {
  if (!(status in STATUSES)) return;
  const supabase = await createClient();
  // RLS 덕분에 내 상품이 아니면 아무 행도 바뀌지 않아요
  await supabase.from("products").update({ status }).eq("id", id);
  revalidatePath(`/products/${id}`);
  revalidatePath("/");
  revalidatePath("/me");
}

export async function deleteProduct(id: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("image_paths")
    .maybeSingle();
  if (data?.image_paths?.length) {
    await supabase.storage.from(IMAGE_BUCKET).remove(data.image_paths);
  }
  revalidatePath("/");
  revalidatePath("/me");
  redirect("/");
}

// 좋아요 누르기/취소. liked = 지금 화면에 보이는 상태(true면 취소, false면 추가)
export async function toggleLike(productId: number, liked: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${productId}`);

  if (liked) {
    await supabase.from("likes").delete().eq("user_id", user.id).eq("product_id", productId);
  } else {
    // 이미 눌러져 있으면(두 번 클릭 등) 기본키 중복 에러가 나는데, 결과는 같으니 무시해요
    await supabase.from("likes").insert({ product_id: productId });
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  revalidatePath("/me");
}
