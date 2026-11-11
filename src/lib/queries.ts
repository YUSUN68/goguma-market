import { createClient } from "@/lib/supabase/server";
import type { CategoryId, Product } from "@/lib/products";

// profiles 테이블을 seller라는 이름으로 같이 가져와요 (seller_id 외래키로 연결)
const PRODUCT_COLUMNS =
  "id, seller_id, title, description, price, category, status, image_paths, created_at, seller:profiles(nickname)";

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
