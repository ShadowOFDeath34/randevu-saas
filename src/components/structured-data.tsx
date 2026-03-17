// JSON-LD Structured Data for SEO
export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'RandevuAI',
          description: 'Küçük ve orta ölçekli işletmeler için AI destekli randevu ve müşteri yönetimi sistemi',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'TRY',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
          },
          featureList: [
            'Online randevu sistemi',
            'Otomatik hatırlatma',
            'Müşteri yönetimi',
            'AI destekli analiz',
            'Kiosk modu',
            'Kampanya yönetimi',
          ],
          author: {
            '@type': 'Organization',
            name: 'RandevuAI',
            url: 'https://randevuai.com',
          },
        }),
      }}
    />
  )
}
