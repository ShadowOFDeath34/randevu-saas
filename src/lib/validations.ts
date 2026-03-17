import { z } from 'zod'

/**
 * Guclu sifre validasyonu
 * - En az 8 karakter
 * - En az 1 buyuk harf
 * - En az 1 kucuk harf
 * - En az 1 rakam
 * - En az 1 ozel karakter
 */
const passwordSchema = z.string()
  .min(8, 'Sifre en az 8 karakter olmali')
  .regex(/[A-Z]/, 'Sifre en az 1 buyuk harf icermeli')
  .regex(/[a-z]/, 'Sifre en az 1 kucuk harf icermeli')
  .regex(/[0-9]/, 'Sifre en az 1 rakam icermeli')
  .regex(/[^A-Za-z0-9]/, 'Sifre en az 1 ozel karakter icermeli (!@#$%^&* gibi)')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Isim en az 2 karakter olmali'),
  email: z.string().trim().email('Gecerli bir e-posta adresi girin'),
  password: passwordSchema,
  businessName: z.string().trim().min(2, 'Isletme adi en az 2 karakter olmali'),
  slug: z.string().trim().min(3, 'URL en az 3 karakter olmali').regex(/^[a-z0-9-çğıöşü]+$/, 'Sadece kucuk harf, rakam, tire ve Turkce karakterler kullanilabilir')
})

export const loginSchema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin'),
  password: z.string().trim().min(1, 'Şifre gereklidir')
})

export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Hizmet adı gereklidir'),
  description: z.string().trim().optional(),
  durationMinutes: z.number().min(5, 'Süre en az 5 dakika olmalı'),
  price: z.number().min(0, 'Fiyat negatif olamaz').optional(),
  currency: z.string().default('TRY'),
  isActive: z.boolean().default(true)
})

export const staffSchema = z.object({
  fullName: z.string().trim().min(2, 'Personel adı gereklidir'),
  title: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Geçerli e-posta').optional().or(z.literal('')),
  bio: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string()).optional()
})

export const customerSchema = z.object({
  fullName: z.string().trim().min(2, 'Müşteri adı gereklidir'),
  phone: z.string().trim().min(10, 'Geçerli bir telefon numarası girin'),
  email: z.string().trim().email('Geçerli e-posta').optional().or(z.literal('')),
  notes: z.string().trim().optional()
})

export const bookingSchema = z.object({
  customerId: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Ad soyad gereklidir'),
  customerPhone: z.string().trim().min(10, 'Telefon gereklidir'),
  customerEmail: z.string().trim().email('Geçerli e-posta').optional().or(z.literal('')),
  customerNotes: z.string().trim().optional(),
  serviceId: z.string('Hizmet seçimi gereklidir'),
  staffId: z.string('Personel seçimi gereklidir'),
  bookingDate: z.string('Tarih seçimi gereklidir'),
  startTime: z.string('Saat seçimi gereklidir')
})

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2, 'İşletme adı gereklidir'),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Geçerli e-posta').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  description: z.string().trim().optional(),
  timezone: z.string().default('Europe/Istanbul')
})

export const businessHoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    isClosed: z.boolean()
  })
)
