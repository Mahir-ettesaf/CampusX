import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type NotificationType = "application_update" | "announcement" | "team" | "planner" | "system";
export type CampusNotification = { id:number; type:NotificationType; title:string; message:string; is_read:boolean; related_entity_type:string|null; related_entity_id:number|null; created_at:string; read_at:string|null };
export type NotificationListOptions = { unread?:true; limit?:number; offset?:number };

const authenticatedConfig = async () => { const session=await getStoredAuthSession(); if(!session) throw new Error("Your session has expired. Please log in again."); return {headers:{Authorization:`Bearer ${session.token}`},timeout:10000}; };
export const getNotifications = async (options:NotificationListOptions={}) => (await axios.get<{notifications:CampusNotification[]}>(`${API_BASE_URL}/notifications`,{...(await authenticatedConfig()),params:options})).data.notifications;
export const getNotificationById = async (notificationId:number) => (await axios.get<{notification:CampusNotification}>(`${API_BASE_URL}/notifications/${notificationId}`,await authenticatedConfig())).data.notification;
export const markNotificationAsRead = async (notificationId:number) => (await axios.put<{notification:CampusNotification}>(`${API_BASE_URL}/notifications/${notificationId}/read`,undefined,await authenticatedConfig())).data.notification;
export const markAllNotificationsAsRead = async () => (await axios.put<{marked_count:number}>(`${API_BASE_URL}/notifications/read-all`,undefined,await authenticatedConfig())).data;
export const deleteNotification = async (notificationId:number) => {await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`,await authenticatedConfig());};
export const isUnauthorizedNotificationError=(error:unknown)=>axios.isAxiosError(error)&&error.response?.status===401;
export const getNotificationErrorMessage=(error:unknown)=>{if(axios.isAxiosError(error)){if(error.response?.status===401)return "Your session has expired. Please log in again.";if(error.response?.status===403)return "You are not allowed to access notifications.";if(error.response?.status===404)return "The notification could not be found.";if(error.code==="ECONNABORTED")return "The request timed out. Please check your connection and try again.";return error.response?.data?.message||"Unable to process the notification request.";}return error instanceof Error?error.message:"Unable to process the notification request.";};
