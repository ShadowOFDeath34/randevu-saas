import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://randevuai.com'

  // Statik sayfalar
  const staticPages = [
    '',
    '/login',
    '/register',
    '/pricing',
    '/privacy',
    '/terms',
    '/kvkk/aydinlatma',
    '/kvkk/basvuru',
    '/forgot-password',
    '/reset-password',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return staticPages
}
