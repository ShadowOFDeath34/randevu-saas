import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RandevuAI - Akıllı Randevu Yönetimi",
    template: "%s | RandevuAI"
  },
  description: "Küçük ve orta ölçekli işletmeler için AI destekli randevu, hatırlatma, müşteri takibi ve yorum toplama platformu. Berber, kuaför, güzellik salonu, diş kliniği ve daha fazlası için.",
  keywords: ["randevu sistemi", "online randevu", "işletme yönetimi", "berber randevu", "kuaför randevu", "güzellik salonu", "diş kliniği randevu", "AI randevu", "otomatik hatırlatma"],
  authors: [{ name: "RandevuAI" }],
  creator: "RandevuAI",
  publisher: "RandevuAI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://randevuai.com",
    siteName: "RandevuAI",
    title: "RandevuAI - Akıllı Randevu Yönetimi",
    description: "Küçük ve orta ölçekli işletmeler için AI destekli randevu yönetim platformu",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RandevuAI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "RandevuAI - Akıllı Randevu Yönetimi",
    description: "Küçük ve orta ölçekli işletmeler için AI destekli randevu yönetim platformu",
    images: ["/og-image.png"]
  },
  manifest: "/manifest.json",
  verification: {
    google: "google-site-verification-code",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
