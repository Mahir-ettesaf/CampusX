import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type ApplicationStatus = "submitted" | "reviewing" | "shortlisted" | "rejected" | "accepted" | "withdrawn";
export type Application = {
  id: number; opportunity_id: number; applicant_id: number; resume_id: number | null; status: ApplicationStatus;
  cover_letter: string | null; submitted_at: string; opportunity_title: string; opportunity_type?: string; deadline?: string;
  creator_user_id: number; applicant_name?: string; applicant_email?: string; applicant_role?: string;
  resume_title?: string | null; resume_summary?: string | null; resume_file_url?: string | null;
  skill_match?: SkillMatch;
};

export type SkillMatch = {
  can_calculate: boolean; percentage: number | null; total_required_skills: number; matched_skill_count: number;
  matched_skills: Array<{ skill_id: number; skill_name: string; proficiency_level: string }>;
  missing_skills: Array<{ skill_id: number; skill_name: string }>;
  message?: string;
};

const authenticatedConfig = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 };
};

export const getMyApplications = async () => (await axios.get<{ applications: Application[] }>(`${API_BASE_URL}/applications`, await authenticatedConfig())).data.applications;
export const getApplication = async (id: number) => (await axios.get<{ application: Application }>(`${API_BASE_URL}/applications/${id}`, await authenticatedConfig())).data.application;
export const getOpportunityApplications = async (opportunityId: number) => (await axios.get<{ applications: Application[] }>(`${API_BASE_URL}/opportunities/${opportunityId}/applications`, await authenticatedConfig())).data.applications;
export const getRecruiterApplicantRankings = async (opportunityId: number) => (await axios.get<{ applications: Application[] }>(`${API_BASE_URL}/opportunities/${opportunityId}/applications/ranking`, await authenticatedConfig())).data.applications;
export const updateApplicationStatus = async (applicationId: number, status: "reviewing" | "shortlisted" | "rejected" | "accepted") => (await axios.put<{ application: Application }>(`${API_BASE_URL}/applications/${applicationId}/status`, { status }, await authenticatedConfig())).data.application;
export const apply = async (id: number, resume_id: number, cover_letter: string | null) => (await axios.post<{ application: Application }>(`${API_BASE_URL}/opportunities/${id}/applications`, { resume_id, cover_letter }, await authenticatedConfig())).data.application;
export const withdraw = async (id: number) => (await axios.put<{ application: Application }>(`${API_BASE_URL}/applications/${id}/withdraw`, {}, await authenticatedConfig())).data.application;

export const appError = (error: unknown) => axios.isAxiosError(error) ? error.response?.status === 401 ? "Your session has expired. Please log in again." : error.code === "ECONNABORTED" ? "The request timed out. Please check your connection and try again." : error.response?.data?.message || "Unable to process your application." : error instanceof Error ? error.message : "Unable to process your application.";
export const unauthorized = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
