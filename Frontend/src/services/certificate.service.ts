import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession } from "./authservice";

export type Certificate = {
  id: number;
  user_id: number;
  title: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CertificateInput = {
  title: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
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

export const getMyCertificates = async (): Promise<Certificate[]> => {
  const response = await axios.get<{ certificates: Certificate[] }>(
    `${API_BASE_URL}/profile/certificates`,
    await getAuthenticatedConfig(),
  );
  return response.data.certificates;
};

export const createMyCertificate = async (certificate: CertificateInput): Promise<Certificate> => {
  const response = await axios.post<{ certificate: Certificate }>(
    `${API_BASE_URL}/profile/certificates`,
    certificate,
    await getAuthenticatedConfig(),
  );
  return response.data.certificate;
};

export const updateMyCertificate = async (
  certificateId: number,
  certificate: CertificateInput,
): Promise<Certificate> => {
  const response = await axios.put<{ certificate: Certificate }>(
    `${API_BASE_URL}/profile/certificates/${certificateId}`,
    certificate,
    await getAuthenticatedConfig(),
  );
  return response.data.certificate;
};

export const deleteMyCertificate = async (certificateId: number) => {
  await axios.delete(`${API_BASE_URL}/profile/certificates/${certificateId}`, await getAuthenticatedConfig());
};
export const uploadMyCertificateFile = async (certificateId: number, file: { uri: string; name: string; mimeType: string }): Promise<Certificate> => { const form = new FormData(); form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob); const request = await getAuthenticatedConfig(); return (await axios.post<{ certificate: Certificate }>(`${API_BASE_URL}/profile/certificates/${certificateId}/upload`, form, { ...request, headers: { ...request.headers, "Content-Type": "multipart/form-data" } })).data.certificate; };

export const isUnauthorizedCertificateError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

export const getCertificateErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }
    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please check your connection and try again.";
    }
    return error.response?.data?.message || "Unable to reach the certificates service. Please try again.";
  }

  return error instanceof Error ? error.message : "Unable to process your certificate request.";
};
