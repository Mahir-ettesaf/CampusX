import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type Company = { id: number; name: string; description: string | null; website: string | null; logo: string | null; location: string | null; approval_status?: "pending" | "approved" | "rejected"; approved_at?: string | null; created_by?: number | null; created_at?: string; updated_at?: string };
export type CompanyInput = { name: string; description: string | null; website: string | null; logo: string | null; location: string | null };
const c = async () => { const session = await getStoredAuthSession(); if (!session) throw Error("Your session has expired. Please log in again."); return { headers: { Authorization: `Bearer ${session.token}` }, timeout: 10000 }; };
export const companies = async () => (await axios.get<{ companies: Company[] }>(`${API_BASE_URL}/companies`, await c())).data.companies;
export const company = async (id: number) => (await axios.get<{ company: Company }>(`${API_BASE_URL}/companies/${id}`, await c())).data.company;
export const createCompany = async (data: CompanyInput) => (await axios.post<{ company: Company }>(`${API_BASE_URL}/companies`, data, await c())).data.company;
export const updateCompany = async (id: number, data: CompanyInput) => (await axios.put<{ company: Company }>(`${API_BASE_URL}/companies/${id}`, data, await c())).data.company;
export const getAdminCompanies = async () => (await axios.get<{ companies: Company[] }>(`${API_BASE_URL}/admin/companies`, await c())).data.companies;
export const updateCompanyApproval = async (id: number, approval_status: "approved" | "rejected") => (await axios.put<{ company: Company }>(`${API_BASE_URL}/companies/${id}/approval`, { approval_status }, await c())).data.company;
export const companyError = (error: unknown) => axios.isAxiosError(error) ? error.response?.status === 401 ? "Your session has expired. Please log in again." : error.code === "ECONNABORTED" ? "The request timed out. Please try again." : error.response?.data?.message || "Unable to process the company request." : error instanceof Error ? error.message : "Unable to process the company request.";
