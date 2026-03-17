import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalBookings: number;
  totalCustomers: number;
  totalRevenue: number;
  completionRate: number;
  todayBookings: number;
  pendingBookings: number;
  weeklyComparison: {
    bookings: number;
    revenue: number;
    customers: number;
  };
}

interface RevenueData {
  labels: string[];
  data: number[];
}

interface ServicePopularity {
  name: string;
  count: number;
  revenue: number;
}

interface StaffPerformance {
  name: string;
  bookings: number;
  revenue: number;
  completionRate: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch("/api/analytics/dashboard");
  if (!response.ok) {
    throw new Error("Dashboard istatistikleri yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchRevenueData = async (period: string = "7d"): Promise<RevenueData> => {
  const response = await fetch(`/api/analytics/revenue?period=${period}`);
  if (!response.ok) {
    throw new Error("Gelir verileri yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchServicePopularity = async (): Promise<ServicePopularity[]> => {
  const response = await fetch("/api/analytics/services");
  if (!response.ok) {
    throw new Error("Hizmet popülerliği verileri yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchStaffPerformance = async (): Promise<StaffPerformance[]> => {
  const response = await fetch("/api/analytics/staff");
  if (!response.ok) {
    throw new Error("Personel performans verileri yüklenirken hata oluştu");
  }
  return response.json();
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: fetchDashboardStats,
    refetchInterval: 5 * 60 * 1000, // 5 dakikada bir yenile
  });
}

export function useRevenueData(period: string = "7d") {
  return useQuery({
    queryKey: ["analytics", "revenue", period],
    queryFn: () => fetchRevenueData(period),
  });
}

export function useServicePopularity() {
  return useQuery({
    queryKey: ["analytics", "services"],
    queryFn: fetchServicePopularity,
  });
}

export function useStaffPerformance() {
  return useQuery({
    queryKey: ["analytics", "staff"],
    queryFn: fetchStaffPerformance,
  });
}

interface AnalyticsStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  repeatCustomers: number;
  averageRating: number;
  popularServices: { name: string; count: number }[];
  topStaff: { name: string; count: number }[];
  dailyBookings: { date: string; count: number }[];
  weeklyStats: { day: string; bookings: number; revenue: number }[];
}

const fetchAnalyticsStats = async (period: string): Promise<AnalyticsStats> => {
  const response = await fetch(`/api/analytics?period=${period}`);
  if (!response.ok) {
    throw new Error("Analytics verileri yüklenirken hata oluştu");
  }
  return response.json();
};

export function useAnalyticsStats(period: string) {
  return useQuery({
    queryKey: ["analytics", "stats", period],
    queryFn: () => fetchAnalyticsStats(period),
  });
}
