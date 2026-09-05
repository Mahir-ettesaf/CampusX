import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export const PROFICIENCY_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

export type Skill = {
  skill_id: number;
  name: string;
  normalized_name: string;
  proficiency_level: ProficiencyLevel;
};

export type AvailableSkill = {
  id: number;
  name: string;
  normalized_name: string;
};

const getAuthenticatedConfig = async () => {
  const session = await getStoredAuthSession();

  if (!session) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    headers: { Authorization: `Bearer ${session.token}` },
    timeout: 10000,
  };
};

export const getAvailableSkills = async (search = ""): Promise<AvailableSkill[]> => {
  const response = await axios.get<{ skills: AvailableSkill[] }>(
    `${API_BASE_URL}/skills`,
    { ...(await getAuthenticatedConfig()), params: search ? { search } : undefined },
  );
  return response.data.skills;
};

export const getMySkills = async (): Promise<Skill[]> => {
  const response = await axios.get<{ skills: Skill[] }>(
    `${API_BASE_URL}/profile/skills`,
    await getAuthenticatedConfig(),
  );
  return response.data.skills;
};

export const addMySkill = async (name: string, proficiencyLevel: ProficiencyLevel) => {
  const response = await axios.post<{ skill: Skill }>(
    `${API_BASE_URL}/profile/skills`,
    { name, proficiency_level: proficiencyLevel },
    await getAuthenticatedConfig(),
  );
  return response.data.skill;
};

export const updateMySkill = async (
  skillId: number,
  proficiencyLevel: ProficiencyLevel,
) => {
  const response = await axios.put<{ skill: Skill }>(
    `${API_BASE_URL}/profile/skills/${skillId}`,
    { proficiency_level: proficiencyLevel },
    await getAuthenticatedConfig(),
  );
  return response.data.skill;
};

export const deleteMySkill = async (skillId: number) => {
  await axios.delete(`${API_BASE_URL}/profile/skills/${skillId}`, await getAuthenticatedConfig());
};

export const getSkillErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Unable to reach the skills service. Please try again.";
  }

  return error instanceof Error ? error.message : "Unable to process your skill request.";
};
