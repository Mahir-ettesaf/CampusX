import axios from "axios";
import API_BASE_URL from "../config/api";

export const registerUser = async (userData: {
  full_name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

  return response.data;
};

export const loginUser = async (userData: {
  email: string;
  password: string;
}) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, userData);

  return response.data;
};
