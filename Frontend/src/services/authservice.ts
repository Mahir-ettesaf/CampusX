import axios from "axios";
import * as SecureStore from "expo-secure-store";
import API_BASE_URL from "../config/api";

const AUTH_SESSION_KEY = "campusx.auth.session";

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

export type AuthSession = {
  token: string;
  user: User;
};

export const registerUser = async (userData: {
  full_name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
    timeout: 10000,
  });

  return response.data;
};

export const loginUser = async (userData: {
  email: string;
  password: string;
}): Promise<AuthSession> => {
  const response = await axios.post<AuthSession>(
    `${API_BASE_URL}/auth/login`,
    userData,
  );

  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/password-reset/request`,
    { email },
    { timeout: 10000 },
  );
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/password-reset/confirm`,
    { token, password },
    { timeout: 10000 },
  );
  return response.data;
};

export const saveAuthSession = async (session: AuthSession) => {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
};

export const getStoredAuthSession = async (): Promise<AuthSession | null> => {
  const storedSession = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as AuthSession;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return null;
  }
};

export const clearAuthSession = async () => {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
};

export const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return fallbackMessage;
};
