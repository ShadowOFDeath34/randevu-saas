import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack ile uyumsuz paketleri external olarak isaretle
  serverExternalPackages: ['iyzipay'],

  // Static sayfa optimizasyonu
  output: 'standalone',

  // Görsel optimizasyonu
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
    // Performans için görsel boyut limiti
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // HTTP sıkıştırma ve önbellekleme + CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: (process.env.NEXT_PUBLIC_APP_URL || 'https://randevu-saas-pearl.vercel.app').replace(/\n/g, '').trim() },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/:path(.+\\.(?:ico|png|svg|jpg|jpeg|gif|webp|avif|woff|woff2|ttf|otf|css|js)$)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  // Webpack optimizasyonları (Turbopack için de geçerli)
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
    ],
  },

  // Derleme optimizasyonları
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Powered by header'ı kaldır
  poweredByHeader: false,
};

export default nextConfig;
