import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Campaign {
  id: string;
  name: string;
  targetSegment: string;
  type: string;
  content: string;
  aiGenerated: boolean;
  status: string;
  sentAt: string | null;
  sentCount: number;
  createdAt: string;
  user: { name: string };
}

interface CampaignsResponse {
  campaigns: Campaign[];
}

interface CreateCampaignInput {
  name: string;
  targetSegment: string;
  type: string;
  content: string;
  aiGenerated: boolean;
}

interface GenerateCampaignInput {
  segment: string;
  type: string;
}

interface GenerateCampaignResponse {
  content: string;
}

const fetchCampaigns = async (): Promise<CampaignsResponse> => {
  const response = await fetch("/api/campaigns");
  if (!response.ok) {
    throw new Error("Kampanyalar yüklenirken hata oluştu");
  }
  return response.json();
};

const generateCampaignContent = async (
  data: GenerateCampaignInput
): Promise<GenerateCampaignResponse> => {
  const response = await fetch("/api/campaigns/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Kampanya içeriği oluşturulurken hata oluştu");
  }
  return response.json();
};

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });
}

export function useGenerateCampaign() {
  return useMutation({
    mutationFn: generateCampaignContent,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignInput) => {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Kampanya oluşturulurken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!response.ok) {
        throw new Error("Kampanya gönderilirken hata oluştu");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export type { Campaign, CampaignsResponse, CreateCampaignInput };
