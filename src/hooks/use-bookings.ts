import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookingStatus } from "@prisma/client";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  notes?: string;
  price: number;
}

interface BookingsParams {
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
  staffId?: string;
  page?: number;
  limit?: number;
}

interface BookingsResponse {
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchBookings = async (params?: BookingsParams): Promise<BookingsResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.staffId) searchParams.set("staffId", params.staffId);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/bookings?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Randevular yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchBookingById = async (id: string): Promise<Booking> => {
  const response = await fetch(`/api/bookings/${id}`);
  if (!response.ok) {
    throw new Error("Randevu detayları yüklenirken hata oluştu");
  }
  return response.json();
};

export function useBookings(params?: BookingsParams) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => fetchBookings(params),
    staleTime: 30 * 1000, // 30 seconds - bookings change frequently
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBookingById(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

interface CreateBookingData {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Randevu oluşturulurken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

interface UpdateBookingData {
  status?: BookingStatus;
  notes?: string;
  serviceId?: string;
  staffId?: string;
  bookingDate?: string;
  startTime?: string;
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBookingData }) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Randevu güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", variables.id] });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Randevu silinirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
