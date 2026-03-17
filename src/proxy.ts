import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16+ proxy.ts - Node.js runtime ile çalışır
export async function proxy(request: NextRequest) {
  const session = await auth()

  const path = request.nextUrl.pathname

  // Güvenlik header'ları ekle
  const response = NextResponse.next()

  // Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.googleusercontent.com https://*.vercel.app;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.vercel.app https://api.resend.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // Protected routes kontrolü
  if (path.startsWith('/dashboard') ||
      path.startsWith('/calendar') ||
      path.startsWith('/bookings') ||
      path.startsWith('/services') ||
      path.startsWith('/staff') ||
      path.startsWith('/customers') ||
      path.startsWith('/settings')) {

    // 1. Session kontrolü
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Tenant ID kontrolü
    if (!session.user.tenantId) {
      console.error('Middleware: Session tenantId eksik', { userId: session.user.id })
      return NextResponse.redirect(new URL('/login?error=no_tenant', request.url))
    }

    // 3. Tenant aktiflik kontrolü (DB sorgusu)
    try {
      const tenant = await db.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { id: true, status: true, slug: true }
      })

      if (!tenant) {
        console.error('Middleware: Tenant bulunamadı', { tenantId: session.user.tenantId })
        return NextResponse.redirect(new URL('/login?error=tenant_not_found', request.url))
      }

      if (tenant.status !== 'active') {
        console.error('Middleware: Tenant pasif', { tenantId: tenant.id, status: tenant.status })
        return NextResponse.redirect(new URL('/login?error=tenant_inactive', request.url))
      }

      // 4. URL'deki tenant slug kontrolü (eğer varsa)
      const urlTenantSlug = request.nextUrl.searchParams.get('tenant')
      if (urlTenantSlug && urlTenantSlug !== session.user.tenantSlug) {
        console.error('Middleware: Tenant slug uyuşmazlığı', {
          urlSlug: urlTenantSlug,
          sessionSlug: session.user.tenantSlug
        })
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

    } catch (error) {
      console.error('Middleware: Tenant kontrolü hatası', error)
      return NextResponse.redirect(new URL('/error', request.url))
    }
  }

  // Admin routes kontrolü
  if (path.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (session.user.role !== 'super_admin') {
      console.warn('Middleware: Yetkisiz admin erişimi', {
        userId: session.user.id,
        role: session.user.role
      })
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}


// Proxy config - Next.js 16+ format
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/calendar/:path*',
    '/bookings/:path*',
    '/services/:path*',
    '/staff/:path*',
    '/customers/:path*',
    '/settings/:path*',
    '/admin/:path*'
  ]
}
