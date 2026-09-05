import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type PlannerItemType = "assignment" | "exam" | "meeting" | "personal" | "thesis_research";
export type PlannerItemStatus = "pending" | "completed" | "cancelled";
export type PlannerPriority = "low" | "medium" | "high";
export type PlannerItem = { id: number; title: string; description: string | null; item_type: PlannerItemType; due_at: string; status: PlannerItemStatus; priority: PlannerPriority; created_at: string; updated_at: string };
export type PlannerItemInput = { title: string; description: string | null; item_type: PlannerItemType; due_at: string; priority: PlannerPriority };
export type PlannerItemUpdate = Partial<PlannerItemInput> & { status?: PlannerItemStatus };
export type PlannerFilters = { item_type?: PlannerItemType; status?: PlannerItemStatus; due_from?: string; due_to?: string; upcoming?: true };

const authenticatedConfig = async () => { const session = await getStoredAuthSession(); if (!session) throw new Error("Your session has expired. Please log in again."); return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 }; };
export const getPlannerItems = async (filters: PlannerFilters = {}) => (await axios.get<{ items: PlannerItem[] }>(`${API_BASE_URL}/planner`, { ...(await authenticatedConfig()), params: filters })).data.items;
export const getPlannerItemById = async (itemId: number) => (await axios.get<{ item: PlannerItem }>(`${API_BASE_URL}/planner/${itemId}`, await authenticatedConfig())).data.item;
export const createPlannerItem = async (data: PlannerItemInput) => (await axios.post<{ item: PlannerItem }>(`${API_BASE_URL}/planner`, data, await authenticatedConfig())).data.item;
export const updatePlannerItem = async (itemId: number, data: PlannerItemUpdate) => (await axios.put<{ item: PlannerItem }>(`${API_BASE_URL}/planner/${itemId}`, data, await authenticatedConfig())).data.item;
export const deletePlannerItem = async (itemId: number) => { await axios.delete(`${API_BASE_URL}/planner/${itemId}`, await authenticatedConfig()); };
export const isUnauthorizedPlannerError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;
export const getPlannerErrorMessage = (error: unknown) => { if (axios.isAxiosError(error)) { if (error.response?.status === 401) return "Your session has expired. Please log in again."; if (error.response?.status === 403) return "Planner is available to students and graduates only."; if (error.response?.status === 404) return "The planner item could not be found."; if (error.code === "ECONNABORTED") return "The request timed out. Please check your connection and try again."; return error.response?.data?.message || "Unable to process the planner request."; } return error instanceof Error ? error.message : "Unable to process the planner request."; };
