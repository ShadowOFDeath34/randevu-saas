import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Business Profile
interface BusinessProfile {
  businessName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  description: string | null;
  bookingSlug: string;
  bufferTimeMinutes?: number;
  cancellationPolicyHours?: number;
  allowOnlineBooking?: boolean;
  maxAdvanceBookingDays?: number;
  minAdvanceBookingHours?: number;
}

// Business Hours
interface BusinessHours {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

// Closed Dates
interface ClosedDate {
  id: string;
  date: string;
  reason: string;
}

// Notification Settings
interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  reminderHours: number[];
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  bookingCancellation: boolean;
  reviewRequest: boolean;
}

// Theme Settings
interface ThemeSettings {
  primaryColor: string;
  logoUrl: string;
  coverImage: string;
}

// Fetch functions
const fetchBusinessProfile = async (): Promise<BusinessProfile> => {
  const response = await fetch("/api/settings/profile");
  if (!response.ok) {
    throw new Error("İşletme profili yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchBusinessHours = async (): Promise<BusinessHours[]> => {
  const response = await fetch("/api/settings/hours");
  if (!response.ok) {
    throw new Error("Çalışma saatleri yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchClosedDates = async (): Promise<ClosedDate[]> => {
  const response = await fetch("/api/settings/closed-dates");
  if (!response.ok) {
    throw new Error("Tatil günleri yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchNotificationSettings = async (): Promise<NotificationSettings> => {
  const response = await fetch("/api/settings/notifications");
  if (!response.ok) {
    throw new Error("Bildirim ayarları yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchThemeSettings = async (): Promise<ThemeSettings> => {
  const response = await fetch("/api/settings/theme");
  if (!response.ok) {
    throw new Error("Tema ayarları yüklenirken hata oluştu");
  }
  return response.json();
};

// Hooks
export function useBusinessProfile() {
  return useQuery({
    queryKey: ["settings", "profile"],
    queryFn: fetchBusinessProfile,
  });
}

export function useBusinessHours() {
  return useQuery({
    queryKey: ["settings", "hours"],
    queryFn: fetchBusinessHours,
  });
}

export function useClosedDates() {
  return useQuery({
    queryKey: ["settings", "closed-dates"],
    queryFn: fetchClosedDates,
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["settings", "notifications"],
    queryFn: fetchNotificationSettings,
  });
}

export function useThemeSettings() {
  return useQuery({
    queryKey: ["settings", "theme"],
    queryFn: fetchThemeSettings,
  });
}

// Mutations
export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<BusinessProfile>) => {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error("Profil güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] });
    },
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours: BusinessHours[]) => {
      const response = await fetch("/api/settings/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours),
      });
      if (!response.ok) {
        throw new Error("Çalışma saatleri güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "hours"] });
    },
  });
}

export function useAddClosedDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { date: string; reason: string }) => {
      const response = await fetch("/api/settings/closed-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Tatil günü eklenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "closed-dates"] });
    },
  });
}

export function useDeleteClosedDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/settings/closed-dates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Tatil günü silinirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "closed-dates"] });
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: NotificationSettings) => {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error("Bildirim ayarları güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "notifications"] });
    },
  });
}

export function useUpdateThemeSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ThemeSettings) => {
      const response = await fetch("/api/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error("Tema ayarları güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "theme"] });
    },
  });
}

export type {
  BusinessProfile,
  BusinessHours,
  ClosedDate,
  NotificationSettings,
  ThemeSettings,
};
