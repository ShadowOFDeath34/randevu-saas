import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Seeding demo data...')

  const passwordHash = await bcrypt.hash('demo123', 12)

  const demoTenants = [
    {
      name: 'Elya Berber',
      slug: 'elya-berber',
      businessName: 'Elya Berber',
      bookingSlug: 'elya-berber',
      services: [
        { name: 'Saç Kesimi', description: 'Profesyonel saç kesimi', durationMinutes: 30, price: 150 },
        { name: 'Sakal Tıraşı', description: 'Sakal tıraşı ve bakım', durationMinutes: 20, price: 100 },
        { name: 'Saç + Sakal', description: 'Tam bakım paketi', durationMinutes: 45, price: 220 },
        { name: 'Çocuk Saç Kesimi', description: '12 yaş altı', durationMinutes: 20, price: 80 }
      ],
      staff: [
        { fullName: 'Ahmet Usta', title: 'Berber' },
        { fullName: 'Mehmet', title: 'Berber' }
      ]
    },
    {
      name: 'Elya Güzellik',
      slug: 'elya-guzellik',
      businessName: 'Elya Güzellik Salonu',
      bookingSlug: 'elya-guzellik',
      services: [
        { name: 'Cilt Bakımı', description: 'Nemlendirici cilt bakımı', durationMinutes: 60, price: 350 },
        { name: 'Manikür', description: 'Klasik manikür', durationMinutes: 30, price: 120 },
        { name: 'Pedikür', description: 'Ayak bakımı', durationMinutes: 40, price: 150 },
        { name: 'Kalıcı Oje', description: 'Kalıcı oje uygulaması', durationMinutes: 45, price: 200 },
        { name: 'Kaş Alma', description: 'Kaş şekillendirme', durationMinutes: 15, price: 50 }
      ],
      staff: [
        { fullName: 'Elif', title: 'Güzellik Uzmanı' },
        { fullName: 'Zeynep', title: 'Kuaför' }
      ]
    },
    {
      name: 'Elya Dental',
      slug: 'elya-dental',
      businessName: 'Elya Diş Kliniği',
      bookingSlug: 'elya-dental',
      services: [
        { name: 'Diş Kontrolü', description: 'Routine check-up', durationMinutes: 20, price: 0 },
        { name: 'Diş Temizliği', description: 'Profesyonel temizlik', durationMinutes: 30, price: 250 },
        { name: 'Dolgu', description: 'Kompozit dolgu', durationMinutes: 45, price: 500 },
        { name: 'Kanal Tedavisi', description: 'Endodontik tedavi', durationMinutes: 90, price: 1500 },
        { name: 'Implant', description: 'Diş implantı', durationMinutes: 120, price: 5000 }
      ],
      staff: [
        { fullName: 'Dr. Ayşe Yılmaz', title: 'Diş Hekimi' },
        { fullName: 'Dr. Kemal', title: 'Diş Hekimi' }
      ]
    }
  ]

  for (const tenantData of demoTenants) {
    const existingTenant = await db.tenant.findUnique({
      where: { slug: tenantData.slug }
    })

    if (existingTenant) {
      console.log(`Tenant ${tenantData.slug} already exists, skipping...`)
      continue
    }

    const tenant = await db.tenant.create({
      data: {
        name: tenantData.name,
        slug: tenantData.slug,
        status: 'active',
        users: {
          create: {
            name: 'Demo User',
            email: `demo@${tenantData.slug}.com`,
            passwordHash,
            role: 'owner'
          }
        },
        businessProfile: {
          create: {
            businessName: tenantData.businessName,
            bookingSlug: tenantData.bookingSlug,
            phone: '+90 532 123 4567',
            address: 'Demo Mahallesi, Demo Sokak No:1',
            city: 'İstanbul',
            description: `${tenantData.businessName} - Profesyonel hizmetler sunmaktayız.`
          }
        },
        businessHours: {
          create: [
            { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00', isClosed: false },
            { dayOfWeek: 0, isClosed: true }
          ]
        }
      }
    })

    console.log(`Created tenant: ${tenant.name}`)

    const services = await Promise.all(
      tenantData.services.map(s => 
        db.service.create({
          data: {
            tenantId: tenant.id,
            name: s.name,
            description: s.description,
            durationMinutes: s.durationMinutes,
            price: s.price,
            isActive: true
          }
        })
      )
    )

    console.log(`Created ${services.length} services for ${tenant.name}`)

    const staffMembers = await Promise.all(
      tenantData.staff.map(s =>
        db.staff.create({
          data: {
            tenantId: tenant.id,
            fullName: s.fullName,
            title: s.title,
            isActive: true
          }
        })
      )
    )

    console.log(`Created ${staffMembers.length} staff members for ${tenant.name}`)

    for (const staff of staffMembers) {
      await db.staffService.createMany({
        data: services.map(service => ({
          tenantId: tenant.id,
          staffId: staff.id,
          serviceId: service.id
        }))
      })

      await db.staffWorkingHour.createMany({
        data: [0,1,2,3,4,5,6].map(day => ({
          tenantId: tenant.id,
          staffId: staff.id,
          dayOfWeek: day,
          openTime: day === 0 ? null : '09:00',
          closeTime: day === 0 ? null : (day === 6 ? '16:00' : '18:00'),
          isClosed: day === 0
        }))
      })
    }

    console.log(`Setup staff services and working hours for ${tenant.name}`)

    const today = new Date()
    const customerNames = ['Ali Veli', 'Ayşe Fatma', 'Mehmet Demir', 'Fatma Yılmaz', 'Ahmet Kaya']
    const customerPhones = ['0532 111 1111', '0532 222 2222', '0532 333 3333', '0532 444 4444', '0532 555 5555']

    const customers = await Promise.all(
      customerNames.map((name, i) =>
        db.customer.create({
          data: {
            tenantId: tenant.id,
            fullName: name,
            phone: customerPhones[i],
            email: `${name.toLowerCase().replace(' ', '.')}@email.com`
          }
        })
      )
    )

    for (let i = 0; i < 5; i++) {
      const randomService = services[Math.floor(Math.random() * services.length)]
      const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)]
      const randomCustomer = customers[i]
      
      const bookingDate = new Date(today)
      bookingDate.setDate(today.getDate() + Math.floor(Math.random() * 10) - 3)
      const dateStr = bookingDate.toISOString().split('T')[0]
      
      const startHour = 9 + Math.floor(Math.random() * 8)
      const startTime = `${startHour.toString().padStart(2, '0')}:00`
      const endHour = startHour + Math.floor(randomService.durationMinutes / 60)
      const endTime = `${endHour.toString().padStart(2, '0')}:${(randomService.durationMinutes % 60).toString().padStart(2, '0')}`

      const statuses = ['pending', 'confirmed', 'completed'] as const

      await db.booking.create({
        data: {
          tenantId: tenant.id,
          customerId: randomCustomer.id,
          serviceId: randomService.id,
          staffId: randomStaff.id,
          bookingDate: dateStr,
          startTime,
          endTime,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          source: 'public'
        }
      })
    }

    console.log(`Created sample bookings for ${tenant.name}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
