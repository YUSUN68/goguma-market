import { createClient } from "@/lib/supabase/server";
import type { CategoryId, Product } from "@/lib/products";

// profiles 테이블을 seller라는 이름으로 같이 가져와요.
// likes 테이블도 products와 profiles를 잇고 있어서, 어떤 외래키로 잇는지 !products_seller_id_fkey로 꼭 지정해요.
const PRODUCT_COLUMNS =
  "id, seller_id, title, description, price, category, status, image_paths, like_count, chat_count, created_at, seller:profiles!products_seller_id_fkey(nickname)";

export async function getProducts(category?: CategoryId) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(40);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as unknown as Product[];
}

// 특정 판매자가 올린 상품 전부 (마이페이지용)
export async function getProductsBySeller(sellerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as Product[];
}

export async function getProduct(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as Product | null;
}

// 내가 이 상품을 좋아요 했는지 (로그인 안 했으면 false)
export async function isLikedByMe(productId: number, userId: string | undefined) {
  if (!userId) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("likes")
    .select("product_id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

// 내가 좋아요 한 상품들 (최근에 누른 순서)
export async function getLikedProducts(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("likes")
    .select(`product:products(${PRODUCT_COLUMNS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data as unknown as { product: Product | null }[];
  return rows.flatMap((r) => (r.product ? [r.product] : []));
}
