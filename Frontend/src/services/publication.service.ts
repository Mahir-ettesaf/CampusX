import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type Publication = { id: number; user_id: number; title: string; authors: string; journal_or_conference: string; publication_date: string; doi: string | null; publication_url: string | null; abstract: string | null; created_at: string; updated_at: string };
export type PublicationInput = { title: string; authors: string; journal_or_conference: string; publication_date: string; doi: string | null; publication_url: string | null; abstract: string | null };

const config = async () => { const session = await getStoredAuthSession(); if (!session) throw new Error("Your session has expired. Please log in again."); return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 }; };
export const getMyPublications = async (): Promise<Publication[]> => (await axios.get<{ publications: Publication[] }>(`${API_BASE_URL}/profile/publications`, await config())).data.publications;
export const createMyPublication = async (data: PublicationInput): Promise<Publication> => (await axios.post<{ publication: Publication }>(`${API_BASE_URL}/profile/publications`, data, await config())).data.publication;
export const updateMyPublication = async (id: number, data: PublicationInput): Promise<Publication> => (await axios.put<{ publication: Publication }>(`${API_BASE_URL}/profile/publications/${id}`, data, await config())).data.publication;
export const deleteMyPublication = async (id: number) => axios.delete(`${API_BASE_URL}/profile/publications/${id}`, await config());
export const uploadMyPublicationFile = async (id: number, file: { uri: string; name: string; mimeType: string }): Promise<Publication> => { const form = new FormData(); form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob); const request = await config(); return (await axios.post<{ publication: Publication }>(`${API_BASE_URL}/profile/publications/${id}/upload`, form, { ...request, headers: { ...request.headers, "Content-Type": "multipart/form-data" } })).data.publication; };
export const isUnauthorizedPublicationError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
export const getPublicationErrorMessage = (error: unknown) => { if (axios.isAxiosError(error)) { if (error.response?.status === 401) return "Your session has expired. Please log in again."; if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again."; return error.response?.data?.message || "Unable to reach the publications service. Please try again."; } return error instanceof Error ? error.message : "Unable to process your publication request."; };
