import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export interface LoyaltyConfig {
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

const DEFAULT_CONFIG: LoyaltyConfig = {
  pointsPerBooking: 10,
  pointsPerCompletion: 50,
  pointsPerReview: 25,
  pointsPerReferral: 100,
  birthdayBonusPoints: 200,
  silverThreshold: 500,
  goldThreshold: 1500,
  platinumThreshold: 3000,
  tierDiscountBronze: 0,
  tierDiscountSilver: 5,
  tierDiscountGold: 10,
  tierDiscountPlatinum: 15
}

// Initialize loyalty config for a tenant
export async function getOrCreateLoyaltyConfig(tenantId: string): Promise<LoyaltyConfig> {
  let config = await db.loyaltyConfig.findUnique({
    where: { tenantId }
  })

  if (!config) {
    config = await db.loyaltyConfig.create({
      data: {
        tenantId,
        ...DEFAULT_CONFIG
      }
    })
  }

  return {
    pointsPerBooking: config.pointsPerBooking,
    pointsPerCompletion: config.pointsPerCompletion,
    pointsPerReview: config.pointsPerReview,
    pointsPerReferral: config.pointsPerReferral,
    birthdayBonusPoints: config.birthdayBonusPoints,
    silverThreshold: config.silverThreshold,
    goldThreshold: config.goldThreshold,
    platinumThreshold: config.platinumThreshold,
    tierDiscountBronze: config.tierDiscountBronze,
    tierDiscountSilver: config.tierDiscountSilver,
    tierDiscountGold: config.tierDiscountGold,
    tierDiscountPlatinum: config.tierDiscountPlatinum
  }
}

// Update customer tier based on total points
export async function updateCustomerTier(customerId: string, totalPoints: number): Promise<void> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: { tenant: { include: { loyaltyConfig: true } } }
  })

  if (!customer || !customer.tenant.loyaltyConfig) return

  const config = customer.tenant.loyaltyConfig
  let newTier = 'BRONZE'

  if (totalPoints >= config.platinumThreshold) {
    newTier = 'PLATINUM'
  } else if (totalPoints >= config.goldThreshold) {
    newTier = 'GOLD'
  } else if (totalPoints >= config.silverThreshold) {
    newTier = 'SILVER'
  }

  if (customer.loyaltyTier !== newTier) {
    await db.customer.update({
      where: { id: customerId },
      data: { loyaltyTier: newTier }
    })
  }
}

// Add points to customer
export async function addPoints(
  tenantId: string,
  customerId: string,
  points: number,
  type: 'EARNED_BOOKING' | 'EARNED_COMPLETION' | 'EARNED_REVIEW' | 'EARNED_REFERRAL' | 'EARNED_BIRTHDAY' | 'EARNED_BONUS',
  description: string,
  bookingId?: string
): Promise<void> {
  // Create transaction
  await db.loyaltyTransaction.create({
    data: {
      tenantId,
      customerId,
      type,
      points,
      description,
      bookingId,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    }
  })

  // Update customer points
  const customer = await db.customer.update({
    where: { id: customerId },
    data: {
      loyaltyPoints: { increment: points },
      totalPointsEarned: { increment: points }
    }
  })

  // Update tier
  await updateCustomerTier(customerId, customer.totalPointsEarned)
}

// Redeem points for reward
export async function redeemPoints(
  tenantId: string,
  customerId: string,
  rewardType: string,
  pointsCost: number,
  value: number
): Promise<{ success: boolean; rewardId?: string; error?: string }> {
  const customer = await db.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer || customer.loyaltyPoints < pointsCost) {
    return { success: false, error: 'Insufficient points' }
  }

  // Deduct points
  await db.customer.update({
    where: { id: customerId },
    data: { loyaltyPoints: { decrement: pointsCost } }
  })

  // Create transaction record
  await db.loyaltyTransaction.create({
    data: {
      tenantId,
      customerId,
      type: 'REDEEMED_REWARD',
      points: -pointsCost,
      description: `Redeemed ${rewardType}`
    }
  })

  // Create reward
  const reward = await db.rewardRedemption.create({
    data: {
      tenantId,
      customerId,
      rewardType,
      pointsCost,
      value,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  })

  return { success: true, rewardId: reward.id }
}

// Create referral code for customer
export async function createReferralCode(customerId: string): Promise<string> {
  const code = nanoid(8).toUpperCase()

  await db.customer.update({
    where: { id: customerId },
    data: { referralCode: code }
  })

  return code
}

// Process referral
export async function processReferral(tenantId: string, referralCode: string, newCustomerId: string): Promise<void> {
  const referrer = await db.customer.findFirst({
    where: { referralCode, tenantId }
  })

  if (!referrer || referrer.id === newCustomerId) return

  const config = await getOrCreateLoyaltyConfig(tenantId)

  // Create referral record
  await db.referral.create({
    data: {
      tenantId,
      referrerId: referrer.id,
      referredId: newCustomerId,
      status: 'pending'
    }
  })

  // Update new customer
  await db.customer.update({
    where: { id: newCustomerId },
    data: { referredBy: referrer.id }
  })
}

// Complete referral (when referred customer makes first booking)
export async function completeReferral(tenantId: string, customerId: string): Promise<void> {
  const referral = await db.referral.findUnique({
    where: { referredId: customerId },
    include: { referrer: true }
  })

  if (!referral || referral.status !== 'pending') return

  const config = await getOrCreateLoyaltyConfig(tenantId)

  // Update referral status
  await db.referral.update({
    where: { id: referral.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      pointsAwarded: config.pointsPerReferral
    }
  })

  // Award points to referrer
  await addPoints(
    tenantId,
    referral.referrerId,
    config.pointsPerReferral,
    'EARNED_REFERRAL',
    `Referral bonus for ${referral.referrer.fullName}`
  )

  // Award points to referred customer
  await addPoints(
    tenantId,
    customerId,
    config.pointsPerReferral,
    'EARNED_REFERRAL',
    'Welcome bonus from referral'
  )
}

// Get customer's active rewards
export async function getActiveRewards(customerId: string) {
  return db.rewardRedemption.findMany({
    where: {
      customerId,
      status: 'active',
      expiryDate: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Get customer's transaction history
export async function getTransactionHistory(customerId: string, limit: number = 50) {
  return db.loyaltyTransaction.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

// Get tier discount percentage
export function getTierDiscount(tier: string, config: LoyaltyConfig): number {
  switch (tier) {
    case 'BRONZE': return config.tierDiscountBronze
    case 'SILVER': return config.tierDiscountSilver
    case 'GOLD': return config.tierDiscountGold
    case 'PLATINUM': return config.tierDiscountPlatinum
    default: return 0
  }
}
