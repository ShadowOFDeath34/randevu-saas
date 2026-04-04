'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Branch {
  id: string
  name: string
  code: string | null
  type: 'main' | 'satellite' | 'mobile' | 'franchise'
  status: 'active' | 'inactive' | 'maintenance'
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  hasOnlineBooking: boolean
  _count: {
    staff: number
    bookings: number
  }
}

const TYPE_LABELS: Record<string, string> = {
  main: 'Ana Şube',
  satellite: 'Yan Şube',
  mobile: 'Mobil',
  franchise: 'Franchise'
}

const TYPE_COLORS: Record<string, string> = {
  main: 'bg-blue-500',
  satellite: 'bg-green-500',
  mobile: 'bg-orange-500',
  franchise: 'bg-purple-500'
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/branches')
      if (!response.ok) throw new Error('Veri yüklenemedi')
      const data = await response.json()
      setBranches(data)
      setError(null)
    } catch (err) {
      setError('Şubeler yüklenirken hata oluştu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>
      case 'inactive':
        return <Badge variant="secondary">Pasif</Badge>
      case 'maintenance':
        return <Badge className="bg-yellow-500">Bakımda</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Şubeler</h1>
        <p className="text-muted-foreground mb-6">Tüm lokasyonlarınızı yönetin</p>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchBranches}>Tekrar Dene</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeBranches = branches.filter(b => b.status === 'active')
  const totalStaff = branches.reduce((acc, b) => acc + b._count.staff, 0)
  const totalBookings = branches.reduce((acc, b) => acc + b._count.bookings, 0)

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Şubeler</h1>
          <p className="text-muted-foreground mt-1">Tüm lokasyonlarınızı yönetin</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Şube
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Şube
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeBranches.length} aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Personel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              Tüm şubelerde
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Randevu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Son 30 gün
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online Rezervasyon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branches.filter(b => b.hasOnlineBooking).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aktif şube
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Branches Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className={branch.status !== 'active' ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${TYPE_COLORS[branch.type]}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{branch.name}</CardTitle>
                    <CardDescription>{TYPE_LABELS[branch.type]}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(branch.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedBranch(branch); setIsDetailDialogOpen(true) }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      {branch.type !== 'main' && (
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deaktif Et
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                {branch.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{branch.city}{branch.district ? `, ${branch.district}` : ''}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{branch.email}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{branch._count.staff} personel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{branch._count.bookings} randevu</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Şube Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir lokasyon ekleyin. Her şube kendi personel ve randevularını yönetebilir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Şube Adı *</label>
              <Input placeholder="örn: Kadıköy Şubesi" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Şube Kodu</label>
              <Input placeholder="örn: IST-001" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Şube Tipi</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                <option value="satellite">Yan Şube</option>
                <option value="mobile">Mobil</option>
                <option value="franchise">Franchise</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Şehir</label>
                <Input placeholder="İstanbul" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">İlçe</label>
                <Input placeholder="Kadıköy" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <Input placeholder="+90 555 123 4567" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input type="email" placeholder="sube@ornek.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={() => { setIsCreateDialogOpen(false) }}>
              Şube Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
