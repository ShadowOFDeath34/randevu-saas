'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Users, Shield, Trash2, Edit, Palette } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string | null
  color: string
  permissions: string
  type: string
  isActive: boolean
  userRoles: Array<{
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

const permissionCategories = {
  bookings: {
    label: 'Randevular',
    icon: '📅',
    permissions: [
      { key: 'bookings:read', label: 'Randevuları Görüntüle' },
      { key: 'bookings:create', label: 'Randevu Oluştur' },
      { key: 'bookings:update', label: 'Randevu Düzenle' },
      { key: 'bookings:delete', label: 'Randevu Sil' }
    ]
  },
  customers: {
    label: 'Müşteriler',
    icon: '👥',
    permissions: [
      { key: 'customers:read', label: 'Müşterileri Görüntüle' },
      { key: 'customers:manage', label: 'Müşterileri Yönet' }
    ]
  },
  staff: {
    label: 'Personel',
    icon: '👤',
    permissions: [
      { key: 'staff:read', label: 'Personeli Görüntüle' },
      { key: 'staff:manage', label: 'Personeli Yönet' }
    ]
  },
  services: {
    label: 'Hizmetler',
    icon: '✂️',
    permissions: [
      { key: 'services:read', label: 'Hizmetleri Görüntüle' },
      { key: 'services:manage', label: 'Hizmetleri Yönet' }
    ]
  },
  calendar: {
    label: 'Takvim',
    icon: '📆',
    permissions: [
      { key: 'calendar:read', label: 'Takvimi Görüntüle' },
      { key: 'calendar:manage', label: 'Takvimi Yönet' }
    ]
  },
  analytics: {
    label: 'Analitik',
    icon: '📊',
    permissions: [
      { key: 'analytics:read', label: 'Raporları Görüntüle' },
      { key: 'analytics:export', label: 'Raporları Dışa Aktar' }
    ]
  },
  settings: {
    label: 'Ayarlar',
    icon: '⚙️',
    permissions: [
      { key: 'settings:read', label: 'Ayarları Görüntüle' },
      { key: 'settings:manage', label: 'Ayarları Yönet' }
    ]
  },
  billing: {
    label: 'Faturalandırma',
    icon: '💳',
    permissions: [
      { key: 'billing:read', label: 'Faturaları Görüntüle' },
      { key: 'billing:manage', label: 'Faturaları Yönet' }
    ]
  },
  admin: {
    label: 'Yönetim',
    icon: '🔐',
    permissions: [
      { key: 'admin:full_access', label: 'Tam Erişim (Super Admin)' }
    ]
  }
}

export default function RolesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4f46e5',
    permissions: [] as string[],
    autoAssignNewUsers: false
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/settings/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: 'Rol oluşturuldu',
          description: `${formData.name} rolü başarıyla oluşturuldu.`
        })
        setIsCreateOpen(false)
        resetForm()
        fetchRoles()
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Rol oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRole) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/settings/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: 'Rol güncellendi',
          description: `${formData.name} rolü başarıyla güncellendi.`
        })
        setIsEditOpen(false)
        setSelectedRole(null)
        resetForm()
        fetchRoles()
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Rol güncellenirken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`"${role.name}" rolünü silmek istediğinizden emin misiniz?`)) return

    try {
      const response = await fetch(`/api/settings/roles/${role.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Rol silindi',
          description: `${role.name} rolü başarıyla silindi.`
        })
        fetchRoles()
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Rol silinirken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#4f46e5',
      permissions: [],
      autoAssignNewUsers: false
    })
  }

  const openEdit = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || '',
      color: role.color,
      permissions: JSON.parse(role.permissions || '[]'),
      autoAssignNewUsers: false
    })
    setIsEditOpen(true)
  }

  const togglePermission = (permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }))
  }

  const toggleCategory = (categoryKey: string) => {
    const category = permissionCategories[categoryKey as keyof typeof permissionCategories]
    const categoryPermissions = category.permissions.map(p => p.key)
    const hasAll = categoryPermissions.every(p => formData.permissions.includes(p))

    setFormData(prev => ({
      ...prev,
      permissions: hasAll
        ? prev.permissions.filter(p => !categoryPermissions.includes(p))
        : [...new Set([...prev.permissions, ...categoryPermissions])]
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roller ve İzinler</h1>
          <p className="text-muted-foreground">
            Kullanıcı rollerini ve erişim izinlerini yönetin.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Rol Oluştur</DialogTitle>
            </DialogHeader>
            <RoleForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: role.color }}
                  >
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {JSON.parse(role.permissions || '[]').length} izin
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {role.type === 'CUSTOM' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {role.description && (
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{role.userRoles.length} kullanıcı</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rolü Düzenle</DialogTitle>
          </DialogHeader>
          <RoleForm />
        </DialogContent>
      </Dialog>
    </div>
  )

  function RoleForm() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Rol Adı</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Manager, Staff, Viewer"
          />
        </div>

        <div className="space-y-2">
          <Label>Açıklama</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Rol açıklaması..."
          />
        </div>

        <div className="space-y-2">
          <Label>Renk</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-12 h-10 p-0 border-0"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>İzinler</Label>
          <div className="space-y-4">
            {Object.entries(permissionCategories).map(([key, category]) => {
              const categoryPermissions = category.permissions.map(p => p.key)
              const allSelected = categoryPermissions.every(p => formData.permissions.includes(p))
              const someSelected = categoryPermissions.some(p => formData.permissions.includes(p))

              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => toggleCategory(key)}
                      />
                      <span className="font-medium">{category.icon} {category.label}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {category.permissions.map((perm) => (
                        <div key={perm.key} className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.permissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
                          />
                          <span className="text-sm">{perm.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => {
            resetForm()
            setIsCreateOpen(false)
            setIsEditOpen(false)
          }}>
            İptal
          </Button>
          <Button
            onClick={selectedRole ? handleUpdate : handleCreate}
            disabled={isSaving || !formData.name}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {selectedRole ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </div>
    )
  }
}
