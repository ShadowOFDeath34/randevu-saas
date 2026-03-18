# Proje Mimarisi ve Pattern'ler

> Bu dosya proje mimarisini ve kullanılan pattern'leri belgeler.
> Son güncelleme: 2026-03-18

## Mimari Genel Bakış

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌──────────────────────────────────────────────────────────────────────────────────┐
        │  React Query (TanStack Query) + Server Actions      │
        └──────────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌──────────────────────────────────────────────────────────────────────────────────┐
        │              Prisma ORM + PostgreSQL                 │
        └──────────────────────────────────────────────────────────────────────────────────┘
```

## Kullanılan Teknolojiler

### Core
- **Next.js 16** - App Router, Turbopack, Server Actions
- **React 19** - Server Components, Client Components
- **TypeScript 5** - Strict mode
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library

### State Management & Data Fetching
- **TanStack Query (React Query) v5** - Server state management
- **React Hook Form** - Form state
- **Zod** - Validation

### Database & ORM
- **Prisma** - ORM
- **PostgreSQL** - Database
- **@prisma/client** - Generated types

### Authentication
- **NextAuth.js v5** - Authentication
- **bcryptjs** - Password hashing

### External Services
- **OpenAI** - AI features
- **Iyzico** - Payment processing
- **Resend** - Email
- **Upstash Redis** - Rate limiting

## Dizin Yapısı

```
src/
├─── app/                          # Next.js App Router
│   ├─── (dashboard)/              # Dashboard layout group
│   │   ├─── bookings/             # Booking pages
│   │   ├─── customers/            # Customer pages
│   │   ├─── services/             # Service pages
│   │   ├─── staff/                # Staff pages
│   │   ├─── settings/             # Settings pages
│   │   ├─── analytics/            # Analytics page
│   │   └─── layout.tsx            # Dashboard layout
│   ├─── api/                      # API Routes
│   │   ├─── bookings/             # Booking API
│   │   ├─── customers/            # Customer API
│   │   ├─── services/             # Service API
│   │   ├─── staff/                # Staff API
│   │   ├─── ...
│   ├─── b/[slug]/                # Public booking
│   ├─── portal/                   # Customer portal
│   ├─── kiosk/[slug]/             # Kiosk mode
│   └─── ...
├─── components/                 # React components
│   ├─── ui/                       # shadcn/ui components
│   ├─── ...
├─── hooks/                      # Custom hooks
│   ├─── use-bookings.ts
│   ├─── use-customers.ts
│   ├─── use-services.ts
│   └─── use-staff.ts
├─── lib/                        # Utilities
│   ├─── auth.ts                 # NextAuth config
│   ├─── db.ts                   # Prisma client
│   ├─── validations.ts          # Zod schemas
│   ├─── utils.ts                # Utility functions
│   └─── ...
├─── types/                      # TypeScript types
└─── __tests__/                  # Test files
```

## Önemli Pattern'ler

### 1. API Route Pattern

```typescript
// src/app/api/resource/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { resourceSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await db.resource.findMany({
      where: { tenantId: session.user.tenantId }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = resourceSchema.parse(body)

    const data = await db.resource.create({
      data: { ...validatedData, tenantId: session.user.tenantId }
    })

    return NextResponse.json(data)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as unknown as { errors: { message: string }[] }
      return NextResponse.json({ error: zodError.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 2. React Query Hook Pattern

```typescript
// src/hooks/use-resource.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const RESOURCE_KEY = 'resource'

export function useResource() {
  return useQuery({
    queryKey: [RESOURCE_KEY],
    queryFn: async () => {
      const res = await fetch('/api/resource')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })
}

export function useCreateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ResourceInput) => {
      const res = await fetch('/api/resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_KEY] })
    }
  })
}
```

### 3. Zod Validation Pattern

```typescript
// src/lib/validations.ts
import { z } from 'zod'

export const customerSchema = z.object({
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
  phone: z.string().min(10, 'Geçerli telefon numarası girin'),
  email: z.string().email().optional(),
  notes: z.string().optional()
})

export const bookingSchema = z.object({
  customerId: z.string(),
  serviceId: z.string(),
  staffId: z.string(),
  startTime: z.string().datetime(),
  notes: z.string().optional()
})
```

### 4. Component Pattern

```typescript
// Client component (interaktif)
'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/use-customers'

export function CustomerList() {
  const { data, isLoading } = useCustomers()
  const [search, setSearch] = useState('')

  if (isLoading) return <Loading />

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* ... */}
    </div>
  )
}
```

### 5. Server Component Pattern

```typescript
// Server component (default)
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const stats = await db.booking.count({
    where: { tenantId: session.user.tenantId }
  })

  return <Dashboard stats={stats} />
}
```

## Multi-Tenancy Yapısı

Her kayıt `tenantId` ile ilişkilendirilir:

```prisma
model Booking {
  id         String   @id @default(cuid())
  tenantId   String
  customerId String
  serviceId  String
  // ...

  tenant   Tenant   @relation(fields: [tenantId], references: [id])
  customer Customer @relation(fields: [customerId], references: [id])
  service  Service  @relation(fields: [serviceId], references: [id])

  @@index([tenantId])
}
```

Tüm API call'ları `tenantId` filtresi içerir:

```typescript
const bookings = await db.booking.findMany({
  where: { tenantId: session.user.tenantId }
})
```

## Önemli Konfigürasyonlar

### next.config.ts
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [...]
  },
  experimental: {
    optimizeCss: true
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    // ...
  }
}
```

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Güvenlik Önlemleri

1. **Authentication** - NextAuth.js ile JWT tabanlı auth
2. **Authorization** - Her API route'ta `tenantId` kontrolü
3. **Rate Limiting** - Upstash Redis ile API rate limiting
4. **Input Validation** - Zod ile tüm input'ların validasyonu
5. **SQL Injection** - Prisma ORM parametrik sorgular
6. **XSS Protection** - React'in built-in escaping'i

## Performans Optimizasyonları

1. **React Query** - Caching, stale-while-revalidate
2. **Prisma Select** - Sadece gerekli alanları çekme
3. **Pagination** - API'de cursor-based pagination
4. **next/image** - Otomatik image optimizasyonu
5. **Turbopack** - Hızlı development build'leri
6. **Server Components** - Zero client JS where possible

## Test Stratejisi

- **Unit Tests** - Vitest + React Testing Library
- **API Tests** - Vitest + mock fetch
- **Hook Tests** - React Testing Library hooks
- **Coverage** - Istanbul (c8)

Test dosya pattern'leri:
- `*.test.ts` - Unit tests
- `*.test.tsx` - Component tests
- `src/app/api/**/route.test.ts` - API route tests
