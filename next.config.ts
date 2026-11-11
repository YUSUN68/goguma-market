import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // 서버 액션으로 사진을 올리니 요청 크기 제한을 늘려요 (기본 1MB)
    // 사진은 브라우저에서 미리 줄여서 보내요 (장당 최대 약 1MB × 5장)
    serverActions: { bodySizeLimit: "8mb" },
  },
  images: {
    // next/image로 Supabase Storage 사진을 보여줄 수 있게 허용
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
