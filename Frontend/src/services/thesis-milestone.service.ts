import axios from "axios"; import API_BASE_URL from "../config/api"; import { getStoredAuthSession } from "./authservice";
export type ThesisMilestone={id:number;title:string;description:string|null;due_date:string;status:"pending"|"in_progress"|"completed";progress_percentage:number;created_at:string;updated_at:string}; export type ThesisMilestoneInput=Pick<ThesisMilestone,"title"|"description"|"due_date"|"status"|"progress_percentage">;
const config=async()=>{const s=await getStoredAuthSession();if(!s)throw new Error("Your session has expired. Please log in again.");return{headers:{Authorization:`Bearer ${s.token}`},timeout:10000};};
export const getThesisMilestones=async()=> (await axios.get<{milestones:ThesisMilestone[]}>(`${API_BASE_URL}/thesis-milestones`,await config())).data.milestones;
export const createThesisMilestone=async(data:ThesisMilestoneInput)=>(await axios.post<{milestone:ThesisMilestone}>(`${API_BASE_URL}/thesis-milestones`,data,await config())).data.milestone;
export const updateThesisMilestone=async(id:number,data:Partial<ThesisMilestoneInput>)=>(await axios.put<{milestone:ThesisMilestone}>(`${API_BASE_URL}/thesis-milestones/${id}`,data,await config())).data.milestone;
export const deleteThesisMilestone=async(id:number)=>axios.delete(`${API_BASE_URL}/thesis-milestones/${id}`,await config());
export const thesisError=(e:unknown)=>axios.isAxiosError(e)?e.response?.data?.message||"Unable to process thesis milestones.":e instanceof Error?e.message:"Unable to process thesis milestones.";
