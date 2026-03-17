import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color?: string;
  isActive: boolean;
}

const fetchServices = async (): Promise<Service[]> => {
  const response = await fetch("/api/services");
  if (!response.ok) {
    throw new Error("Hizmetler yüklenirken hata oluştu");
  }
  return response.json();
};

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
    staleTime: 5 * 60 * 1000, // 5 minutes - services rarely change
  });
}

interface CreateServiceData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  color?: string;
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Hizmet oluşturulurken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateServiceData> }) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Hizmet güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Hizmet silinirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
