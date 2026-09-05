import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type OpportunitySkill = { skill_id: number; name: string; normalized_name: string; created_at: string };

const config = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 };
};

export const getOpportunitySkills = async (opportunityId: number) => (
  await axios.get<{ skills: OpportunitySkill[] }>(`${API_BASE_URL}/opportunities/${opportunityId}/skills`, await config())
).data.skills;

export const addOpportunitySkill = async (opportunityId: number, skillId: number) => (
  await axios.post<{ skills: OpportunitySkill[] }>(`${API_BASE_URL}/opportunities/${opportunityId}/skills`, { skill_id: skillId }, await config())
).data.skills;

export const removeOpportunitySkill = async (opportunityId: number, skillId: number) => {
  await axios.delete(`${API_BASE_URL}/opportunities/${opportunityId}/skills/${skillId}`, await config());
};

export const isUnauthorizedOpportunitySkillError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
export const getOpportunitySkillError = (error: unknown) => axios.isAxiosError(error)
  ? error.response?.data?.message || (error.code === "ECONNABORTED" ? "The request timed out. Please check your connection and try again." : "Unable to process required skills.")
  : error instanceof Error ? error.message : "Unable to process required skills.";
