import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export const PROJECT_TYPES = ["academic", "professional", "personal"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type PortfolioProject = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  project_type: ProjectType;
  start_date: string | null;
  end_date: string | null;
  project_url: string | null;
  github_url: string | null;
  technologies: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = {
  title: string;
  description: string | null;
  project_type: ProjectType;
  start_date: string | null;
  end_date: string | null;
  project_url: string | null;
  github_url: string | null;
  technologies: string | null;
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

export const getMyProjects = async (): Promise<PortfolioProject[]> => {
  const response = await axios.get<{ projects: PortfolioProject[] }>(
    `${API_BASE_URL}/profile/projects`,
    await getAuthenticatedConfig(),
  );
  return response.data.projects;
};

export const createMyProject = async (project: ProjectInput): Promise<PortfolioProject> => {
  const response = await axios.post<{ project: PortfolioProject }>(
    `${API_BASE_URL}/profile/projects`,
    project,
    await getAuthenticatedConfig(),
  );
  return response.data.project;
};

export const updateMyProject = async (
  projectId: number,
  project: ProjectInput,
): Promise<PortfolioProject> => {
  const response = await axios.put<{ project: PortfolioProject }>(
    `${API_BASE_URL}/profile/projects/${projectId}`,
    project,
    await getAuthenticatedConfig(),
  );
  return response.data.project;
};

export const deleteMyProject = async (projectId: number) => {
  await axios.delete(`${API_BASE_URL}/profile/projects/${projectId}`, await getAuthenticatedConfig());
};
export const uploadMyProjectFile = async (projectId: number, file: { uri: string; name: string; mimeType: string }): Promise<PortfolioProject> => { const form = new FormData(); form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob); const request = await getAuthenticatedConfig(); return (await axios.post<{ project: PortfolioProject }>(`${API_BASE_URL}/profile/projects/${projectId}/upload`, form, { ...request, headers: { ...request.headers, "Content-Type": "multipart/form-data" } })).data.project; };

export const isUnauthorizedProjectError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

export const getProjectErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again.";
    return error.response?.data?.message || "Unable to reach the projects service. Please try again.";
  }

  return error instanceof Error ? error.message : "Unable to process your project request.";
};
