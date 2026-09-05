import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type MatchSkill = { skill_id: number; skill_name: string; proficiency_level?: string };
export type OpportunityMatch = {
  opportunity: { id: number; title: string };
  match: {
    can_calculate: boolean;
    percentage: number | null;
    total_required_skills: number;
    matched_skill_count: number;
    matched_skills: MatchSkill[];
    missing_skills: MatchSkill[];
    message?: string;
  };
};

const config = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 };
};

export const getOpportunityMatch = async (opportunityId: number): Promise<OpportunityMatch> => (
  await axios.get<OpportunityMatch>(`${API_BASE_URL}/opportunities/${opportunityId}/match`, await config())
).data;

export const isUnauthorizedMatchError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
export const getMatchErrorMessage = (error: unknown) => axios.isAxiosError(error)
  ? error.response?.data?.message || (error.code === "ECONNABORTED" ? "The skill match request timed out. Please try again." : "Unable to load your skill match.")
  : error instanceof Error ? error.message : "Unable to load your skill match.";
