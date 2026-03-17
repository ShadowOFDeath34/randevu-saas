import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack ile uyumsuz paketleri external olarak isaretle
  serverExternalPackages: ['iyzipay'],

  // Middleware deprecation uyarisi icin (Next.js 16+ proxy.ts kullaniyor)
  // TODO: middleware.ts -> proxy.ts olarak yeniden adlandirilmali
};

export default nextConfig;
