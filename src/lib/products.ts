// 상품 관련 공통 상수와 도우미 함수 (서버/클라이언트 모두에서 써요)

export const CATEGORIES = [
  { id: "digital", label: "디지털", emoji: "💻" },
  { id: "fashion", label: "의류", emoji: "👕" },
  { id: "furniture", label: "가구", emoji: "🛋️" },
  { id: "book", label: "도서", emoji: "📚" },
  { id: "hobby", label: "취미", emoji: "🎮" },
  { id: "kids", label: "유아", emoji: "🧸" },
  { id: "plant", label: "식물", emoji: "🌱" },
  { id: "etc", label: "기타", emoji: "📦" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const STATUSES = {
  selling: { label: "판매중", className: "bg-skin-soft text-skin" },
  reserved: { label: "예약중", className: "bg-flesh text-ink" },
  sold: { label: "거래완료", className: "bg-ink/70 text-white" },
} as const;

export type ProductStatus = keyof typeof STATUSES;

export const MAX_IMAGES = 5;
export const IMAGE_BUCKET = "product-images";

export type Product = {
  id: number;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: CategoryId;
  status: ProductStatus;
  image_paths: string[];
  like_count: number;
  chat_count: number; // 메시지가 오간 채팅방 수 (DB 트리거가 세요)
  created_at: string;
  seller: { nickname: string } | null;
};

export function isCategory(value: unknown): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export function categoryOf(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function formatPrice(price: number) {
  return price === 0 ? "나눔 🧡" : `${price.toLocaleString("ko-KR")}원`;
}

// "3분 전", "2일 전" 같은 상대 시간
export function timeAgo(iso: string, now = Date.now()) {
  const sec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

// Storage에 저장된 경로 → 누구나 볼 수 있는 공개 URL
export function imageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}
