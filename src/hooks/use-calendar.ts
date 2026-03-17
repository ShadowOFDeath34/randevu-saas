import { useQuery } from "@tanstack/react-query";

interface CalendarBooking {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  service: { name: string; durationMinutes: number };
  customer: { fullName: string; phone: string };
  staff: { fullName: string };
}

interface CalendarParams {
  startDate: string;
  endDate: string;
  staffId?: string;
}

const fetchCalendarBookings = async (
  params: CalendarParams
): Promise<CalendarBooking[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set("start", params.startDate);
  searchParams.set("end", params.endDate);
  if (params.staffId) searchParams.set("staffId", params.staffId);

  const response = await fetch(`/api/calendar?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Takvim verileri yüklenirken hata oluştu");
  }
  return response.json();
};

export function useCalendarBookings(params: CalendarParams) {
  return useQuery({
    queryKey: ["calendar", params],
    queryFn: () => fetchCalendarBookings(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}
