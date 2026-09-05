import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type OpportunityType = "internship" | "job" | "ra" | "ta" | "research";
export type OpportunityStatus = "draft" | "published" | "closed";
export type Opportunity = {
  id: number; creator_user_id: number; company_id: number | null; company_name: string | null;
  title: string; description: string; opportunity_type: OpportunityType; location: string | null;
  is_remote: number | boolean; eligibility: string | null; deadline: string; status: OpportunityStatus;
  created_at: string; updated_at: string;
};
export type OpportunityFilters = { opportunity_type?: OpportunityType; location?: string; is_remote?: boolean; search?: string };
export type OpportunityInput = {
  title: string; description: string; opportunity_type: OpportunityType; deadline: string;
  location: string | null; is_remote: boolean; eligibility?: string | null; company_id?: number | null;
};

const authenticatedConfig = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 };
};

export const getOpportunities = async (filters: OpportunityFilters = {}) => (
  await axios.get<{ opportunities: Opportunity[] }>(`${API_BASE_URL}/opportunities`, { ...(await authenticatedConfig()), params: filters })
).data.opportunities;

export const getMyFacultyOpportunities = async () => (
  await axios.get<{ opportunities: Opportunity[] }>(`${API_BASE_URL}/opportunities`, { ...(await authenticatedConfig()), params: { mine: "true" } })
).data.opportunities;

export const getMyRecruiterOpportunities = async () => (
  await axios.get<{ opportunities: Opportunity[] }>(`${API_BASE_URL}/opportunities`, { ...(await authenticatedConfig()), params: { mine: "true" } })
).data.opportunities;

export const getOpportunity = async (id: number) => (
  await axios.get<{ opportunity: Opportunity }>(`${API_BASE_URL}/opportunities/${id}`, await authenticatedConfig())
).data.opportunity;

export const createOpportunity = async (input: OpportunityInput) => (
  await axios.post<{ opportunity: Opportunity }>(`${API_BASE_URL}/opportunities`, input, await authenticatedConfig())
).data.opportunity;

export const updateOpportunity = async (id: number, input: OpportunityInput) => (
  await axios.put<{ opportunity: Opportunity }>(`${API_BASE_URL}/opportunities/${id}`, input, await authenticatedConfig())
).data.opportunity;

export const deleteOpportunity = async (id: number) => {
  await axios.delete(`${API_BASE_URL}/opportunities/${id}`, await authenticatedConfig());
};

export const publishOpportunity = async (id: number) => (
  await axios.post<{ opportunity: Opportunity }>(`${API_BASE_URL}/opportunities/${id}/publish`, {}, await authenticatedConfig())
).data.opportunity;

export const closeOpportunity = async (id: number) => (
  await axios.post<{ opportunity: Opportunity }>(`${API_BASE_URL}/opportunities/${id}/close`, {}, await authenticatedConfig())
).data.opportunity;

export const isUnauthorizedOpportunityError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
export const getOpportunityErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again.";
    return error.response?.data?.message || "Unable to reach opportunities. Please try again.";
  }
  return error instanceof Error ? error.message : "Unable to load opportunities.";
};
