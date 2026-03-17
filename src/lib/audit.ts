import { db } from '@/lib/db'

export type AuditAction = 
  | 'tenant_created'
  | 'tenant_updated'
  | 'tenant_status_changed'
  | 'user_created'
  | 'user_updated'
  | 'service_created'
  | 'service_updated'
  | 'service_deleted'
  | 'staff_created'
  | 'staff_updated'
  | 'staff_deleted'
  | 'booking_created'
  | 'booking_updated'
  | 'booking_status_changed'
  | 'customer_created'
  | 'customer_updated'
  | 'settings_updated'
  | 'subscription_created'
  | 'subscription_updated'
  | 'login'
  | 'logout'

export interface CreateAuditLogParams {
  tenantId: string
  actorUserId?: string
  action: AuditAction
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
}

/**
 * Audit log olustur - hata durumunda bile uygulamayi cokertmez
 * NOT: Audit log'lar kritik oldugu icin hatalari merkezi bir yere yonlendir
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null
      }
    })
  } catch (error) {
    // Kritik: Audit log hatalari sadece console'a yazilmamali
    // TODO: Sentry, LogRocket veya benzeri bir servise yonlendirilmeli
    console.error('[AUDIT LOG ERROR]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      params: {
        tenantId: params.tenantId,
        action: params.action,
        entityType: params.entityType
      }
    })
    
    // Production'da burada bir alerting mekanizmasi olmali
    // Ornegin: Slack webhook, email notification, vb.
  }
}

export async function getAuditLogs(tenantId: string, options?: {
  entityType?: string
  entityId?: string
  limit?: number
}) {
  try {
    const where: any = { tenantId }

    if (options?.entityType) {
      where.entityType = options.entityType
    }

    if (options?.entityId) {
      where.entityId = options.entityId
    }

    return await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }
}

export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    tenant_created: 'İşletme oluşturuldu',
    tenant_updated: 'İşletme güncellendi',
    tenant_status_changed: 'İşletme durumu değiştirildi',
    user_created: 'Kullanıcı oluşturuldu',
    user_updated: 'Kullanıcı güncellendi',
    service_created: 'Hizmet eklendi',
    service_updated: 'Hizmet güncellendi',
    service_deleted: 'Hizmet silindi',
    staff_created: 'Personel eklendi',
    staff_updated: 'Personel güncellendi',
    staff_deleted: 'Personel silindi',
    booking_created: 'Randevu oluşturuldu',
    booking_updated: 'Randevu güncellendi',
    booking_status_changed: 'Randevu durumu değiştirildi',
    customer_created: 'Müşteri eklendi',
    customer_updated: 'Müşteri güncellendi',
    settings_updated: 'Ayarlar güncellendi',
    subscription_created: 'Abonelik oluşturuldu',
    subscription_updated: 'Abonelik güncellendi',
    login: 'Giriş yapıldı',
    logout: 'Çıkış yapıldı'
  }

  return labels[action] || action
}
