import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kayıt Ol',
  description: 'RandevuAI\'ye ücretsiz kayıt olun. İşletmeniz için AI destekli randevu sistemi kurun.',
  robots: { index: false, follow: false },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
