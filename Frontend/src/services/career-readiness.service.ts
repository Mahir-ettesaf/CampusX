import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type CareerReadinessBreakdown = {
  category: string;
  earned: number;
  maximum: number;
  percentage: number | null;
  applicable: boolean;
};

export type CareerReadiness = {
  career_readiness: {
    score: number;
    level: string;
  };
  breakdown: CareerReadinessBreakdown[];
  improvement_areas: string[];
};

const authenticatedConfig = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");

  return {
    headers: { Authorization: `Bearer ${session.token}` },
    timeout: 10000,
  };
};

export const getCareerReadiness = async () => (
  await axios.get<CareerReadiness>(`${API_BASE_URL}/career-readiness`, await authenticatedConfig())
).data;

export const isUnauthorizedCareerReadinessError = (error: unknown) => (
  axios.isAxiosError(error) && error.response?.status === 401
);

export const getCareerReadinessErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.response?.status === 403) return "Career Readiness is available to students and graduates only.";
    if (error.response?.status === 404) return "Your Career Readiness information is currently unavailable.";
    if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again.";
    return error.response?.data?.message || "Unable to load Career Readiness. Please try again.";
  }

  return error instanceof Error ? error.message : "Unable to load Career Readiness. Please try again.";
};
