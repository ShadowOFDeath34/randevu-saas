import type { NextConfig } from "next";

// Security Headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self)'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://*.sentry.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.vercel.app https://*.sentry.io https://api.resend.com https://*.iyzipay.com https://*.upstash.io",
      "frame-src 'self' https://*.iyzipay.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "manifest-src 'self'",
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  // Turbopack ile uyumsuz paketleri external olarak isaretle
  serverExternalPackages: ['iyzipay'],

  // NOT: output: 'standalone' kullanılmıyor - Next.js 16 + Turbopack ile
  // API endpoint'lerinde 500 hatasına neden oluyor

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

  // HTTP sıkıştırma ve önbellekleme + Security + CORS
  async headers() {
    return [
      {
        // API routes için security headers (CSP hariç)
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: (process.env.NEXT_PUBLIC_APP_URL || 'https://randevu-saas-pearl.vercel.app').replace(/\n/g, '').trim() },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Tüm sayfalar için security headers
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Static assets için cache headers (security headers hariç)
        source: '/:path(.+\\.(?:ico|png|svg|jpg|jpeg|gif|webp|avif|woff|woff2|ttf|otf|css|js)$)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
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
