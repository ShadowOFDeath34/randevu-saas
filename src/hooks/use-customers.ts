import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  notes?: string;
  totalBookings: number;
  lastVisit?: Date;
  createdAt: Date;
}

interface CustomersParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

const fetchCustomers = async (
  params?: CustomersParams
): Promise<CustomersResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/customers?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Müşteriler yüklenirken hata oluştu");
  }
  return response.json();
};

const fetchCustomerById = async (id: string): Promise<Customer> => {
  const response = await fetch(`/api/customers/${id}`);
  if (!response.ok) {
    throw new Error("Müşteri detayları yüklenirken hata oluştu");
  }
  return response.json();
};

export function useCustomers(params?: CustomersParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => fetchCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomerById(id),
    enabled: !!id,
  });
}

interface CreateCustomerData {
  name: string;
  email?: string;
  phone: string;
  notes?: string;
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Müşteri oluşturulurken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerData }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Müşteri güncellenirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Müşteri silinirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
