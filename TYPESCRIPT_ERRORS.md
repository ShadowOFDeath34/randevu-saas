# TypeScript Hata Çözüm Rehberi

> Bu dosya sık karşılaşılan TypeScript hatalarının çözümlerini içerir.
> Son güncelleme: 2026-03-18

## Hata Pattern'leri ve Çözümleri

### 1. ZodError Tip Dönüşüm Hatası

**Hata Mesajı:**
```
Conversion of type 'Error' to type '{ errors: { message: string }[] }' may be a mistake...
```

**Neden:**
TypeScript `Error` tipini direkt olarak custom bir tipe dönüştürmeye izin vermez.

**Çözüm:**
```typescript
// catch bloğunda
} catch (error: unknown) {
  if (error instanceof Error && error.name === 'ZodError') {
    // Önce unknown'a, sonra hedef tipe çevir
    const zodError = error as unknown as { errors: { message: string }[] }
    return NextResponse.json({ error: zodError.errors[0].message }, { status: 400 })
  }
}
```

**Uygulanan Dosyalar:**
- `src/app/api/services/route.ts`
- `src/app/api/services/[id]/route.ts`
- `src/app/api/staff/route.ts`
- `src/app/api/staff/[id]/route.ts`
- `src/app/api/register/route.ts`

---

### 2. Prisma Enum Tip Hatası

**Hata Mesajı:**
```
Type 'string' is not assignable to type 'BookingStatus'
```

**Neden:**
String değeri direkt olarak Prisma enum tipine atanamaz.

**Çözüm:**
```typescript
import { BookingStatus } from '@prisma/client'

// Tip dönüşümü yap
where.status = filter as BookingStatus
```

**Uygulanan Dosya:**
- `src/app/api/bookings/route.ts` (satır 45)

---

### 3. Record<string, unknown> Destructuring Hatası

**Hata Mesajı:**
```
Property 'substring' does not exist on type '{}'
```

**Neden:**
`Record<string, unknown>` tipinden destructuring yapıldığında değişkenler `unknown` tipinde olur.

**Çözüm:**
```typescript
// Explicit type annotation ekle
const { status, paymentId, conversationId } = body as {
  status?: string
  paymentId?: string
  conversationId?: string
}
```

**Uygulanan Dosya:**
- `src/app/api/webhooks/iyzico/route.ts` (satır 94)

---

### 4. State Tipi Uyumsuzluğu

**Hata Mesajı:**
```
Property 'fullName' does not exist on type '{ id: string; name: string; phone: string }'
```

**Neden:**
State tipi ve kullanımı farklı property isimleri kullanıyor.

**Çözüm:**
```typescript
// State tipi
const [customer, setCustomer] = useState<{ id: string; name: string; phone: string } | null>(null)

// Kullanım (fullName yerine name)
<h2>{customer?.name}</h2>  // Doğru
// <h2>{customer?.fullName}</h2>  // Yanlış
```

**Uygulanan Dosya:**
- `src/app/portal/page.tsx` (satır 226)

---

### 5. Test Mock Tip Dönüşümü

**Hata Mesajı:**
```
Property 'mockResolvedValueOnce' does not exist on type...
```

**Neden:**
Vi mock fonksiyonları TypeScript tarafından tanınmıyor.

**Çözüm:**
```typescript
// Mock tip dönüşümü
;(auth as unknown as { mockResolvedValueOnce: (value: typeof mockSession) => void })
  .mockResolvedValueOnce(mockSession)
```

**Uygulanan Dosyalar:**
- `src/app/api/customers/route.test.ts`
- `src/app/api/bookings/route.test.ts`

---

### 6. Unknown Tip Dönüşümü

**Hata Mesajı:**
```
'result' is of type 'unknown'
```

**Neden:**
Bir değişken `unknown` tipinde tanımlandığında property erişimi yapılamaz.

**Çözüm:**
```typescript
// Explicit type cast
const result = await someFunction() as {
  status?: string
  paymentStatus?: string
  checkoutFormContent?: string
}
```

**Uygulanan Dosya:**
- `src/app/api/payments/route.ts` (satır 45)

---

## Genel Kurallar

### Tip Dönüşümü Hiyerarşisi
```
any <- unknown -> specific type
```

`unknown` her zaman güvenli bir ara adımdır. Direkt `as Type` yapmak yerine `as unknown as Type` kullanın.

### Prisma ile Çalışırken
1. Enum'ları `@prisma/client`'ten import edin
2. String değerleri enum tipine cast edin
3. `Prisma.SomeWhereInput` tiplerini kullanın

### Test Yazarken
1. Mock'ları `vi.fn()` ile tanımlayın
2. Type casting için `as unknown as { mockFn: ... }` pattern'ini kullanın
3. Testleri gerçek API yanıt yapısıyla senkronize tutun

## Hızlı Başvuru Tablosu

| Hata | Çözüm |
|------|-------|
| `Conversion of type 'Error' to type 'X'` | `error as unknown as X` |
| `Type 'string' is not assignable to type 'Enum'` | `value as EnumType` |
| `Property 'X' does not exist on type '{}'` | `obj as { X?: type }` |
| `'X' is of type 'unknown'` | `X as SpecificType` |
| `mockResolvedValueOnce does not exist` | `(mock as unknown as { mockFn: ... })` |
