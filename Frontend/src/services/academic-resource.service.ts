import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type AcademicResourceType = "lecture_notes" | "slides" | "lab_manual" | "previous_questions" | "research_material" | "other";
export type AcademicResourceStatus = "draft" | "published" | "archived";
export type AcademicResource = {
  id: number;
  title: string;
  description: string | null;
  resource_type: AcademicResourceType;
  subject: string | null;
  resource_url: string | null;
  creator_name: string | null;
  status: AcademicResourceStatus;
  created_at: string;
  updated_at: string;
};
export type AcademicResourceInput = {
  title: string;
  description: string | null;
  resource_type: AcademicResourceType;
  subject: string | null;
  resource_url: string | null;
  status?: AcademicResourceStatus;
};
export type AcademicResourceUpdate = Partial<AcademicResourceInput> & { status?: AcademicResourceStatus };
export type AcademicResourceFilters = { search?: string; resource_type?: AcademicResourceType; subject?: string; status?: AcademicResourceStatus };

const authenticatedConfig = async () => {
  const session = await getStoredAuthSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 };
};

export const getMyResources = async () => (
  await axios.get<{ resources: AcademicResource[] }>(`${API_BASE_URL}/resources`, await authenticatedConfig())
).data.resources;
export const getResources = async (filters: AcademicResourceFilters = {}) => (
  await axios.get<{ resources: AcademicResource[] }>(`${API_BASE_URL}/resources`, { ...(await authenticatedConfig()), params: filters })
).data.resources;
export const getResource = async (resourceId: number) => (
  await axios.get<{ resource: AcademicResource }>(`${API_BASE_URL}/resources/${resourceId}`, await authenticatedConfig())
).data.resource;
export const getResourceById = getResource;
export const createResource = async (data: AcademicResourceInput) => (
  await axios.post<{ resource: AcademicResource }>(`${API_BASE_URL}/resources`, data, await authenticatedConfig())
).data.resource;
export const updateResource = async (resourceId: number, data: AcademicResourceUpdate) => (
  await axios.put<{ resource: AcademicResource }>(`${API_BASE_URL}/resources/${resourceId}`, data, await authenticatedConfig())
).data.resource;
export const deleteResource = async (resourceId: number) => {
  await axios.delete(`${API_BASE_URL}/resources/${resourceId}`, await authenticatedConfig());
};
export const uploadResourceFile = async (resourceId: number, file: { uri: string; name: string; mimeType: string }): Promise<AcademicResource> => { const form = new FormData(); form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob); const request = await authenticatedConfig(); return (await axios.post<{ resource: AcademicResource }>(`${API_BASE_URL}/resources/${resourceId}/upload`, form, { ...request, headers: { ...request.headers, "Content-Type": "multipart/form-data" } })).data.resource; };
export const isUnauthorizedAcademicResourceError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
export const getAcademicResourceErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again.";
    return error.response?.data?.message || "Unable to process the academic resource request.";
  }
  return error instanceof Error ? error.message : "Unable to process the academic resource request.";
};
