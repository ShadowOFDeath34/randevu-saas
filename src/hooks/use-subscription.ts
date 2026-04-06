import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Plan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  features: string[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt?: string;
  description?: string;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  plan: {
    name: string;
    price: number;
    billingPeriod: string;
  };
}

interface SubscriptionData {
  subscription: Subscription | null;
  invoices: Invoice[];
}

const fetchSubscription = async (): Promise<SubscriptionData> => {
  const response = await fetch("/api/subscription");
  if (!response.ok) {
    throw new Error("Abonelik bilgileri yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchPlans = async (): Promise<Plan[]> => {
  const response = await fetch("/api/plans");
  if (!response.ok) {
    throw new Error("Planlar yüklenirken hata oluştu");
  }
  return response.json();
};

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
  });
}

export function useUpgradePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!response.ok) {
        throw new Error("Plan değiştirilirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

interface CheckoutResponse {
  success: boolean;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  conversationId?: string;
  error?: string;
}

export function useCheckoutPlan() {
  return useMutation({
    mutationFn: async (planId: string): Promise<CheckoutResponse> => {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ödeme başlatılırken hata oluştu");
      }

      return data;
    },
  });
}

export type { Plan, Invoice, Subscription, SubscriptionData };
