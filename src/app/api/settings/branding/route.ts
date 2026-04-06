import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Get tenant branding
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branding = await db.tenantBranding.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    if (!branding) {
      // Return default branding
      return NextResponse.json({
        primaryColor: '#4f46e5',
        secondaryColor: '#7c3aed',
        accentColor: '#06b6d4',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        darkBackgroundColor: '#111827',
        darkTextColor: '#f3f4f6',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontScale: '100%',
        themeMode: 'light',
        themeVariant: 'default',
        portalTitle: 'Randevu Portalı',
        portalSubtitle: null,
        bookingPageTitle: 'Randevu Al',
        bookingPageDescription: null,
        showPoweredBy: true,
        showTenantName: true,
        emailHeaderColor: '#4f46e5',
        customDomain: null,
        domainVerified: false
      })
    }

    return NextResponse.json(branding)
  } catch (error) {
    console.error('Error fetching branding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update tenant branding
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate colors are valid hex codes
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    const colorFields = [
      'primaryColor', 'secondaryColor', 'accentColor',
      'backgroundColor', 'textColor', 'darkBackgroundColor',
      'darkTextColor', 'emailHeaderColor'
    ]

    for (const field of colorFields) {
      if (data[field] && !hexRegex.test(data[field])) {
        return NextResponse.json(
          { error: `Invalid color format for ${field}` },
          { status: 400 }
        )
      }
    }

    const branding = await db.tenantBranding.upsert({
      where: { tenantId: session.user.tenantId },
      create: {
        tenantId: session.user.tenantId,
        ...data
      },
      update: data
    })

    // Log the update
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'BRANDING_UPDATED',
        entityType: 'TenantBranding',
        entityId: branding.id,
        metadataJson: JSON.stringify({
          updatedFields: Object.keys(data)
        })
      }
    })

    return NextResponse.json(branding)
  } catch (error) {
    console.error('Error updating branding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
