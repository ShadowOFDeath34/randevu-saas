import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  color?: string;
  isActive: boolean;
}

const fetchStaff = async (): Promise<Staff[]> => {
  const response = await fetch("/api/staff");
  if (!response.ok) {
    throw new Error("Personeller yüklenirken hata oluştu");
  }
  return response.json();
};

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: fetchStaff,
  });
}

interface CreateStaffData {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  color?: string;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStaffData) => {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Personel oluşturulurken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateStaffData> }) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Personel güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Personel silinirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
