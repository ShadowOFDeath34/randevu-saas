'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Trophy,
  Gift,
  Star,
  Crown,
  Users,
  Calendar,
  ChevronRight,
  CheckCircle,
  Clock
} from 'lucide-react'

interface LoyaltyData {
  customer: {
    id: string
    fullName: string
    loyaltyPoints: number
    loyaltyTier: string
    totalPointsEarned: number
    referralCode: string | null
  }
  config: {
    pointsPerBooking: number
    pointsPerCompletion: number
    pointsPerReview: number
    pointsPerReferral: number
    birthdayBonusPoints: number
    silverThreshold: number
    goldThreshold: number
    platinumThreshold: number
    tierDiscountBronze: number
    tierDiscountSilver: number
    tierDiscountGold: number
    tierDiscountPlatinum: number
  }
  transactions: Array<{
    id: string
    type: string
    points: number
    description: string
    createdAt: string
  }>
  activeRewards: Array<{
    id: string
    rewardType: string
    pointsCost: number
    value: number
    expiryDate: string
  }>
  completedReferrals: number
  nextTierProgress: number
  pointsToNextTier: number
}

const TIER_CONFIG = {
  BRONZE: { label: 'Bronz', color: 'bg-amber-700', icon: Star },
  SILVER: { label: 'Gümüş', color: 'bg-slate-400', icon: Trophy },
  GOLD: { label: 'Altın', color: 'bg-yellow-400', icon: Crown },
  PLATINUM: { label: 'Platin', color: 'bg-purple-500', icon: Crown }
}

const REWARD_OPTIONS = [
  { type: 'discount_10', label: '%10 İndirim', points: 500, value: 10 },
  { type: 'discount_20', label: '%20 İndirim', points: 1000, value: 20 },
  { type: 'discount_50', label: '%50 İndirim', points: 2500, value: 50 },
  { type: 'free_addon', label: 'Ücretsiz Eklenti', points: 300, value: 0 }
]

export default function CustomerLoyaltyPage() {
  const params = useParams()
  const customerId = params.id as string
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    fetchLoyaltyData()
  }, [customerId])

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/loyalty?customerId=${customerId}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const redeemReward = async (rewardType: string, pointsCost: number, value: number) => {
    setRedeeming(true)
    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          rewardType,
          pointsCost,
          value
        })
      })

      if (response.ok) {
        fetchLoyaltyData()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setRedeeming(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const tierConfig = TIER_CONFIG[data.customer.loyaltyTier as keyof typeof TIER_CONFIG]
  const TierIcon = tierConfig.icon

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.customer.fullName}</h1>
          <p className="text-muted-foreground">Sadakat Programı</p>
        </div>
        <Badge className={`${tierConfig.color} text-white`}>
          <TierIcon className="h-3 w-3 mr-1" />
          {tierConfig.label} Üye
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mevcut Puan</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.customer.loyaltyPoints}</div>
            <p className="text-xs text-muted-foreground">
              Kullanılabilir puan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kazanılan</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.customer.totalPointsEarned}</div>
            <p className="text-xs text-muted-foreground">
              Program başından beri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Referans</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.completedReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Her biri +{data.config.pointsPerReferral} puan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {data.customer.loyaltyTier !== 'PLATINUM' && (
        <Card>
          <CardHeader>
            <CardTitle>Sonraki Seviyeye İlerleme</CardTitle>
            <CardDescription>
              {data.pointsToNextTier} puan daha kazanarak bir üst seviyeye geçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={data.nextTierProgress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2 text-right">
              %{data.nextTierProgress} tamamlandı
            </p>
          </CardContent>
        </Card>
      )}

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referans Programı
          </CardTitle>
          <CardDescription>
            Arkadaşlarını davet et, her birinden +{data.config.pointsPerReferral} puan kazan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.customer.referralCode ? (
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 bg-muted rounded-lg text-center">
                <span className="text-2xl font-mono font-bold tracking-wider">
                  {data.customer.referralCode}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(data.customer.referralCode!)
                }}
              >
                Kopyala
              </Button>
            </div>
          ) : (
            <Button onClick={() => fetch('/api/loyalty/referral?customerId=' + customerId)
              .then(() => fetchLoyaltyData())}>
              Kod Oluştur
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Ödül Kataloğu
          </CardTitle>
          <CardDescription>Puanlarınızı harcayın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REWARD_OPTIONS.map((reward) => (
              <Card key={reward.type} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{reward.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {reward.points} puan
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={data.customer.loyaltyPoints < reward.points || redeeming}
                      onClick={() => redeemReward(reward.type, reward.points, reward.value)}
                    >
                      {data.customer.loyaltyPoints >= reward.points ? 'Harcama' : 'Yetersiz'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Rewards */}
      {data.activeRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktif Ödüller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.activeRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{reward.rewardType}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reward.expiryDate).toLocaleDateString('tr-TR')} kadar geçerli
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Aktif</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Puan Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
