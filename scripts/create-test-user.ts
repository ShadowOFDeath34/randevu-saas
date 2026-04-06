import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

async function createTestUser() {
  try {
    // Önce tenant'ı bul veya oluştur
    let tenant = await db.tenant.findFirst({
      where: { slug: 'test-salon' }
    })

    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: 'Test Kuaför Salonu',
          slug: 'test-salon',
          status: 'ACTIVE',
          aiFeaturesEnabled: true,
          enableAdvancedRouting: true,
          enableDynamicPricing: true,
        }
      })
      console.log('✓ Tenant oluşturuldu:', tenant.id)
      
      // Business Profile oluştur
      await db.businessProfile.create({
        data: {
          tenantId: tenant.id,
          businessName: 'Test Kuaför Salonu',
          businessType: 'HAIR_SALON',
          bookingSlug: 'test-kuafor',
          phone: '+90 555 123 4567',
          email: 'info@test-salon.com',
          address: 'Test Mahallesi, Test Sokak No:1',
          city: 'Istanbul',
          timezone: 'Europe/Istanbul',
          currency: 'TRY',
        }
      })
      console.log('✓ Business Profile oluşturuldu')
      
      // Business Hours oluştur
      const days = [
        { day: 1, open: '09:00', close: '19:00' },
        { day: 2, open: '09:00', close: '19:00' },
        { day: 3, open: '09:00', close: '19:00' },
        { day: 4, open: '09:00', close: '19:00' },
        { day: 5, open: '09:00', close: '19:00' },
        { day: 6, open: '10:00', close: '18:00' },
      ]
      
      for (const day of days) {
        await db.businessHour.create({
          data: {
            tenantId: tenant.id,
            dayOfWeek: day.day,
            openTime: day.open,
            closeTime: day.close,
            isOpen: true,
          }
        })
      }
      console.log('✓ Business Hours oluşturuldu')
      
    } else {
      // Tenant'ı güncelle - tüm özellikleri aktif et
      tenant = await db.tenant.update({
        where: { id: tenant.id },
        data: {
          aiFeaturesEnabled: true,
          enableAdvancedRouting: true,
          enableDynamicPricing: true,
        }
      })
      console.log('✓ Mevcut tenant bulundu ve güncellendi:', tenant.id)
    }

    // Test kullanıcısı oluştur
    const hashedPassword = await hash('Test123!', 12)

    const user = await db.user.upsert({
      where: { email: 'enes@test.com' },
      update: {
        role: 'owner',
        status: 'ACTIVE',
        tenantId: tenant.id,
        password: hashedPassword,
      },
      create: {
        email: 'enes@test.com',
        name: 'Enes Test',
        password: hashedPassword,
        role: 'owner',
        status: 'ACTIVE',
        tenantId: tenant.id,
        emailVerified: new Date(),
      },
    })

    console.log('\n✅ Test kullanıcısı hazır:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    })

    console.log('\n════════════════════════════════════')
    console.log('      GİRİŞ BİLGİLERİ')
    console.log('════════════════════════════════════')
    console.log('📧 Email: enes@test.com')
    console.log('🔑 Şifre: Test123!')
    console.log('🏢 Tenant: Test Kuaför Salonu')
    console.log('👑 Rol: Owner (Full Yetki)')
    console.log('════════════════════════════════════')
    console.log('\n🚀 Aktif Özellikler:')
    console.log('   ✓ AI Analytics')
    console.log('   ✓ Advanced Routing')
    console.log('   ✓ Dynamic Pricing')
    console.log('   ✓ Loyalty System')
    console.log('   ✓ Campaign Automation')
    console.log('   ✓ API Keys & Webhooks')
    console.log('   ✓ Audit Logging')
    console.log('   ✓ RBAC & Permissions')

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await db.$disconnect()
  }
}

createTestUser()
