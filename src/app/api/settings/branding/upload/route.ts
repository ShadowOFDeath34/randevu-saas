import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

// POST - Upload branding assets
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo', 'logoDark', 'favicon'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, SVG, WebP' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Max size: 2MB' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const filename = `${session.user.tenantId}/${type}-${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false
    })

    // Update branding record
    const updateField = type === 'logoDark' ? 'logoDarkUrl' :
                       type === 'favicon' ? 'faviconUrl' : 'logoUrl'

    await db.tenantBranding.upsert({
      where: { tenantId: session.user.tenantId },
      create: {
        tenantId: session.user.tenantId,
        [updateField]: blob.url
      },
      update: {
        [updateField]: blob.url
      }
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      type
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
