import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type AnnouncementType = "academic" | "assignment" | "general";
export type AnnouncementAudience = "student" | "graduate" | "faculty" | "recruiter" | "all";
export type AnnouncementStatus = "draft" | "published" | "archived";
export type Announcement = {
  id: number;
  title: string;
  content: string;
  announcement_type: AnnouncementType;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  creator_name: string | null;
};
export type AnnouncementInput = {
  title: string;
  content: string;
  announcement_type: AnnouncementType;
  audience: AnnouncementAudience;
  status?: AnnouncementStatus;
};
export type AnnouncementUpdate = Partial<AnnouncementInput>;
export type AnnouncementFilters = { search?: string; announcement_type?: AnnouncementType };

const authenticatedConfig = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 };
};

export const getAnnouncements = async (filters: AnnouncementFilters = {}) => (
  await axios.get<{ announcements: Announcement[] }>(`${API_BASE_URL}/announcements`, { ...(await authenticatedConfig()), params: filters })
).data.announcements;
export const getAnnouncement = async (announcementId: number) => (
  await axios.get<{ announcement: Announcement }>(`${API_BASE_URL}/announcements/${announcementId}`, await authenticatedConfig())
).data.announcement;
export const createAnnouncement = async (data: AnnouncementInput) => (
  await axios.post<{ announcement: Announcement }>(`${API_BASE_URL}/announcements`, data, await authenticatedConfig())
).data.announcement;
export const updateAnnouncement = async (announcementId: number, data: AnnouncementUpdate) => (
  await axios.put<{ announcement: Announcement }>(`${API_BASE_URL}/announcements/${announcementId}`, data, await authenticatedConfig())
).data.announcement;
export const deleteAnnouncement = async (announcementId: number) => {
  await axios.delete(`${API_BASE_URL}/announcements/${announcementId}`, await authenticatedConfig());
};
export const isUnauthorizedAnnouncementError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
export const getAnnouncementErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.response?.status === 403) return "You are not allowed to access announcements.";
    if (error.response?.status === 404) return "The announcement could not be found.";
    if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again.";
    return error.response?.data?.message || "Unable to process the announcement request.";
  }
  return error instanceof Error ? error.message : "Unable to process the announcement request.";
};
