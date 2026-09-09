import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type Resume = {
  id: number;
  user_id: number;
  title: string;
  summary: string | null;
  file_url: string | null;
  is_primary: number | boolean;
  created_at: string;
  updated_at: string;
};

export type ResumeInput = {
  title: string;
  summary: string | null;
  file_url: string | null;
  is_primary: boolean;
};

export type ResumeAiReview = {
  resume_id: number;
  overall_assessment: string;
  strengths: string[];
  improvement_suggestions: string[];
  missing_sections: string[];
  keyword_suggestions: string[];
  ats_considerations: string[];
};

export type ResumeDocument = {
  uri: string;
  name: string;
  mimeType: string;
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

export const getMyResumes = async (): Promise<Resume[]> => {
  const response = await axios.get<{ resumes: Resume[] }>(
    `${API_BASE_URL}/profile/resumes`,
    await getAuthenticatedConfig(),
  );
  return response.data.resumes;
};

export const createMyResume = async (resume: ResumeInput): Promise<Resume> => {
  const response = await axios.post<{ resume: Resume }>(
    `${API_BASE_URL}/profile/resumes`,
    resume,
    await getAuthenticatedConfig(),
  );
  return response.data.resume;
};

export const updateMyResume = async (resumeId: number, resume: ResumeInput): Promise<Resume> => {
  const response = await axios.put<{ resume: Resume }>(
    `${API_BASE_URL}/profile/resumes/${resumeId}`,
    resume,
    await getAuthenticatedConfig(),
  );
  return response.data.resume;
};

export const deleteMyResume = async (resumeId: number) => {
  await axios.delete(`${API_BASE_URL}/profile/resumes/${resumeId}`, await getAuthenticatedConfig());
};

export const reviewMyResume = async (resumeId: number): Promise<ResumeAiReview> => {
  const config = await getAuthenticatedConfig();
  const response = await axios.post<{ review: ResumeAiReview }>(
    `${API_BASE_URL}/profile/resumes/${resumeId}/review`,
    {},
    { ...config, timeout: 30000 },
  );
  return response.data.review;
};

export const uploadMyResumeDocument = async (resumeId: number, document: ResumeDocument): Promise<Resume> => {
  const formData = new FormData();
  formData.append("file", { uri: document.uri, name: document.name, type: document.mimeType } as unknown as Blob);
  const config = await getAuthenticatedConfig();
  const response = await axios.post<{ resume: Resume }>(
    `${API_BASE_URL}/profile/resumes/${resumeId}/upload`,
    formData,
    { ...config, timeout: 30000, headers: { ...config.headers, "Content-Type": "multipart/form-data" } },
  );
  return response.data.resume;
};

export const isUnauthorizedResumeError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

export const getResumeErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "The request timed out. Please check your connection and try again.";
    }
    return error.response?.data?.message || "Unable to reach the resume service. Please try again.";
  }

  return error instanceof Error ? error.message : "Unable to process your resume request.";
};
