import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type OpportunityRecommendation = {
  opportunity: {
    id: number;
    title: string;
    type: "internship" | "job" | "ra" | "ta" | "research";
    location: string | null;
    remote: boolean;
    deadline: string;
  };
  match: {
    percentage: number | null;
    matched_skill_count: number;
    total_required_skill_count: number;
    can_calculate: boolean;
  };
};

const authenticatedConfig = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");

  return {
    headers: { Authorization: `Bearer ${session.token}` },
    timeout: 10000,
  };
};

export const getRecommendedOpportunities = async () => (
  await axios.get<{ recommendations: OpportunityRecommendation[] }>(
    `${API_BASE_URL}/recommendations/opportunities`,
    await authenticatedConfig(),
  )
).data.recommendations;

export const isUnauthorizedRecommendationError = (error: unknown) => (
  axios.isAxiosError(error) && error.response?.status === 401
);

export const getRecommendationErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.response?.status === 403) return "Recommendations are available to students and graduates only.";
    if (error.response?.status === 404) return "Recommendations are currently unavailable.";
    if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again.";
    return error.response?.data?.message || "Unable to load recommendations. Please try again.";
  }

  return error instanceof Error ? error.message : "Unable to load recommendations. Please try again.";
};
