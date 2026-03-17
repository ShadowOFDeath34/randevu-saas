import { useQuery } from "@tanstack/react-query";

interface RevenueSummary {
  totalRevenue: number;
  totalBookings: number;
  averageRevenuePerBooking: number;
  revenueGrowth: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
}

interface ServiceBreakdown {
  name: string;
  revenue: number;
  count: number;
}

interface RevenueData {
  summary: RevenueSummary;
  dailyRevenue: DailyRevenue[];
  serviceBreakdown: ServiceBreakdown[];
}

const fetchRevenueReport = async (period: string): Promise<RevenueData> => {
  const response = await fetch(`/api/reports/revenue?period=${period}`);
  if (!response.ok) {
    throw new Error("Gelir raporu yüklenirken hata oluştu");
  }
  return response.json();
};

export function useRevenueReport(period: string) {
  return useQuery({
    queryKey: ["reports", "revenue", period],
    queryFn: () => fetchRevenueReport(period),
  });
}

export type { RevenueData, RevenueSummary, DailyRevenue, ServiceBreakdown };
