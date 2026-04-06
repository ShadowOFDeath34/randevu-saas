import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Get custom domain status
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branding = await db.tenantBranding.findUnique({
      where: { tenantId: session.user.tenantId },
      select: {
        customDomain: true,
        domainVerified: true,
        sslStatus: true
      }
    })

    return NextResponse.json({
      customDomain: branding?.customDomain || null,
      domainVerified: branding?.domainVerified || false,
      sslStatus: branding?.sslStatus || 'pending',
      // DNS instructions for verification
      dnsRecords: branding?.customDomain ? [
        {
          type: 'CNAME',
          name: branding.customDomain,
          value: `${session.user.tenantSlug}.randevu.app`,
          ttl: 3600
        }
      ] : []
    })
  } catch (error) {
    console.error('Error fetching custom domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Request custom domain
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domain } = await request.json()

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Check if domain is already in use
    const existing = await db.tenantBranding.findFirst({
      where: {
        customDomain: domain,
        NOT: { tenantId: session.user.tenantId }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Domain already in use by another tenant' },
        { status: 409 }
      )
    }

    // Update branding record
    await db.tenantBranding.upsert({
      where: { tenantId: session.user.tenantId },
      create: {
        tenantId: session.user.tenantId,
        customDomain: domain,
        domainVerified: false,
        sslStatus: 'pending'
      },
      update: {
        customDomain: domain,
        domainVerified: false,
        sslStatus: 'pending'
      }
    })

    // In a real implementation, this would trigger DNS verification
    // and SSL provisioning workflows

    return NextResponse.json({
      success: true,
      domain,
      status: 'pending',
      message: 'Domain registration initiated. Please configure DNS records.',
      dnsRecords: [
        {
          type: 'CNAME',
          name: domain,
          value: `${session.user.tenantSlug}.randevu.app`,
          ttl: 3600
        }
      ]
    })
  } catch (error) {
    console.error('Error registering custom domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Verify custom domain
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branding = await db.tenantBranding.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    if (!branding?.customDomain) {
      return NextResponse.json(
        { error: 'No custom domain configured' },
        { status: 400 }
      )
    }

    // In a real implementation, this would perform DNS verification
    // For now, simulate verification
    const isVerified = true // Mock verification

    if (isVerified) {
      await db.tenantBranding.update({
        where: { tenantId: session.user.tenantId },
        data: {
          domainVerified: true,
          sslStatus: 'active'
        }
      })
    }

    return NextResponse.json({
      success: true,
      domain: branding.customDomain,
      verified: isVerified,
      sslStatus: isVerified ? 'active' : 'pending'
    })
  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove custom domain
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.tenantBranding.update({
      where: { tenantId: session.user.tenantId },
      data: {
        customDomain: null,
        domainVerified: false,
        sslStatus: 'pending'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing custom domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
