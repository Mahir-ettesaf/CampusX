import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type AdminDashboardStatistics = {
  total_users: number;
  students: number;
  graduates: number;
  faculty: number;
  recruiters: number;
  companies: number;
  pending_companies: number;
  approved_companies: number;
  opportunities: number;
  published_opportunities: number;
  applications: number;
};

const authenticatedConfig = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");

  return {
    headers: { Authorization: `Bearer ${session.token}` },
    timeout: 10000,
  };
};

export const getAdminDashboard = async () => (
  await axios.get<{ statistics: AdminDashboardStatistics }>(
    `${API_BASE_URL}/admin/dashboard`,
    await authenticatedConfig(),
  )
).data.statistics;

export const isUnauthorizedAdminDashboardError = (error: unknown) => (
  axios.isAxiosError(error) && error.response?.status === 401
);

export const getAdminDashboardErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.response?.status === 403) return "Administrator access is required to view the dashboard.";
    if (error.response?.status === 404) return "Dashboard statistics are currently unavailable.";
    if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again.";
    return error.response?.data?.message || "Unable to load dashboard statistics. Please try again.";
  }

  return error instanceof Error ? error.message : "Unable to load dashboard statistics. Please try again.";
};
