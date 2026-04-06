'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ScrollText, Filter, Download, ChevronLeft, ChevronRight, User, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: any
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const actionLabels: Record<string, string> = {
  'USER_CREATED': 'Kullanici Olusturuldu',
  'USER_UPDATED': 'Kullanici Guncellendi',
  'USER_DELETED': 'Kullanici Silindi',
  'BOOKING_CREATED': 'Randevu Olusturuldu',
  'BOOKING_UPDATED': 'Randevu Guncellendi',
  'BOOKING_CANCELLED': 'Randevu Iptal Edildi',
  'BOOKING_CONFIRMED': 'Randevu Onaylandi',
  'BOOKING_COMPLETED': 'Randevu Tamamlandi',
  'CUSTOMER_CREATED': 'Musteri Olusturuldu',
  'CUSTOMER_UPDATED': 'Musteri Guncellendi',
  'CUSTOMER_DELETED': 'Musteri Silindi',
  'STAFF_CREATED': 'Personel Olusturuldu',
  'STAFF_UPDATED': 'Personel Guncellendi',
  'STAFF_DELETED': 'Personel Silindi',
  'SERVICE_CREATED': 'Hizmet Olusturuldu',
  'SERVICE_UPDATED': 'Hizmet Guncellendi',
  'SERVICE_DELETED': 'Hizmet Silindi',
  'ROLE_CREATED': 'Rol Olusturuldu',
  'ROLE_UPDATED': 'Rol Guncellendi',
  'ROLE_DELETED': 'Rol Silindi',
  'API_KEY_CREATED': 'API Anahtari Olusturuldu',
  'API_KEY_REVOKED': 'API Anahtari Iptal Edildi',
  'WEBHOOK_CREATED': 'Webhook Olusturuldu',
  'WEBHOOK_UPDATED': 'Webhook Guncellendi',
  'WEBHOOK_DELETED': 'Webhook Silindi',
  'LOGIN': 'Giris Yapildi',
  'LOGOUT': 'Cikis Yapildi',
  'SETTINGS_UPDATED': 'Ayarlar Guncellendi',
  'BRANDING_UPDATED': 'Marka Guncellendi'
}

const entityTypeLabels: Record<string, string> = {
  'User': 'Kullanici',
  'Booking': 'Randevu',
  'Customer': 'Musteri',
  'Staff': 'Personel',
  'Service': 'Hizmet',
  'Role': 'Rol',
  'ApiKey': 'API Anahtari',
  'Webhook': 'Webhook',
  'Tenant': 'Isletme',
  'TenantBranding': 'Marka',
  'Campaign': 'Kampanya',
  'CampaignTrigger': 'Tetikleyici'
}

const actionColors: Record<string, string> = {
  'CREATED': 'bg-green-500',
  'UPDATED': 'bg-blue-500',
  'DELETED': 'bg-red-500',
  'CANCELLED': 'bg-orange-500',
  'CONFIRMED': 'bg-green-600',
  'COMPLETED': 'bg-purple-500',
  'REVOKED': 'bg-red-600',
  'LOGIN': 'bg-indigo-500',
  'LOGOUT': 'bg-gray-500'
}

export default function AuditLogsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    actions: [] as string[],
    entityTypes: [] as string[]
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [filterParams, setFilterParams] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchLogs()
  }, [pagination.page])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (filterParams.action) params.append('action', filterParams.action)
      if (filterParams.entityType) params.append('entityType', filterParams.entityType)
      if (filterParams.startDate) params.append('startDate', filterParams.startDate)
      if (filterParams.endDate) params.append('endDate', filterParams.endDate)

      const response = await fetch(`/api/settings/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
        setFilters(data.filters)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Tarih', 'Kullanici', 'Aksiyon', 'Tip', 'Detay'].join(','),
      ...logs.map(log => [
        new Date(log.createdAt).toLocaleString('tr-TR'),
        log.user?.name || log.user?.email || 'Sistem',
        actionLabels[log.action] || log.action,
        entityTypeLabels[log.entityType] || log.entityType,
        JSON.stringify(log.metadata || {}).slice(0, 100)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast({ title: 'Indirildi', description: 'Denetim kayitlari CSV olarak indirildi.' })
  }

  const getActionColor = (action: string) => {
    const suffix = action.split('_').pop() || ''
    return actionColors[suffix] || 'bg-gray-500'
  }

  const openDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Denetim Kayitlari</h1>
          <p className="text-muted-foreground">
            Sistemdeki tum islem kayitlarini goruntuleyin.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Disa Aktar
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs mb-2 block">Aksiyon</Label>
              <Select value={filterParams.action} onValueChange={(v) => setFilterParams(p => ({ ...p, action: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tumu</SelectItem>
                  {filters.actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {actionLabels[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Varlik Tipi</Label>
              <Select value={filterParams.entityType} onValueChange={(v) => setFilterParams(p => ({ ...p, entityType: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tumu</SelectItem>
                  {filters.entityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {entityTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Baslangic Tarihi</Label>
              <Input
                type="date"
                value={filterParams.startDate}
                onChange={(e) => setFilterParams(p => ({ ...p, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-xs mb-2 block">Bitis Tarihi</Label>
              <Input
                type="date"
                value={filterParams.endDate}
                onChange={(e) => setFilterParams(p => ({ ...p, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={fetchLogs}>Filtrele</Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Kullanici</TableHead>
                <TableHead>Aksiyon</TableHead>
                <TableHead>Varlik</TableHead>
                <TableHead className="text-right">Detay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Kayit bulunamadi.</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(log)}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                        <Clock className="h-3 w-3 text-muted-foreground ml-1" />
                        {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.user?.name || log.user?.email || 'Sistem'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Goruntule
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Toplam {pagination.total} kayit, Sayfa {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Onceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              Sonraki
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Islem Detayi</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Aksiyon</Label>
                  <p className="font-medium">{actionLabels[selectedLog.action] || selectedLog.action}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Varlik Tipi</Label>
                  <p className="font-medium">{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Varlik ID</Label>
                  <p className="font-medium font-mono text-xs">{selectedLog.entityId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tarih</Label>
                  <p className="font-medium">{new Date(selectedLog.createdAt).toLocaleString('tr-TR')}</p>
                </div>
              </div>

              {selectedLog.user && (
                <>
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground text-xs mb-2 block">Kullanici</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedLog.user.name || 'Isimsiz'}</p>
                        <p className="text-sm text-muted-foreground">{selectedLog.user.email}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedLog.metadata && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground text-xs mb-2 block">Metadata</Label>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
