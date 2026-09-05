import axios from "axios";
import API_BASE_URL from "../config/api";
import { getStoredAuthSession, User } from "./authservice";

export type CommonProfile = {
  id: number;
  user_id: number;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  portfolio_url: string | null;
};

export type AcademicProfile = {
  student_id: string;
  department: string;
  program: string;
  degree_level: string;
  graduation_year: number;
  cgpa: number;
  interests: string | null;
};

export type FacultyProfile = {
  department: string;
  designation: string;
  research_areas: string | null;
  office_location: string | null;
  contact_details: string | null;
};

export type RecruiterProfile = {
  company_id: number;
  job_title: string | null;
  company_name: string;
  company_description: string | null;
  company_website: string | null;
  company_location: string | null;
  company_approval_status: string;
};

export type ProfileResponse = {
  success: boolean;
  user: User & {
    profile_picture: string | null;
    is_verified: number | boolean | null;
  };
  profile: CommonProfile | null;
  academic_profile?: AcademicProfile | null;
  faculty_profile?: FacultyProfile | null;
  recruiter_profile?: RecruiterProfile | null;
};

export type CommonProfileInput = {
  headline: string;
  bio: string;
  phone: string;
  location: string;
  linkedin_url: string;
  github_username: string;
  portfolio_url: string;
};

export type GitHubPortfolio = {
  profile: { login: string; name: string | null; avatar_url: string; html_url: string; bio: string | null; company: string | null; location: string | null; blog: string | null; public_repos: number; followers: number; following: number };
  repositories: Array<{ id: number; name: string; description: string | null; html_url: string; language: string | null; stargazers_count: number; forks_count: number; updated_at: string }>;
  languages: Array<{ name: string; bytes: number }>;
  repositories_limited_to: number;
};

const getAuthenticatedConfig = async () => {
  const session = await getStoredAuthSession();

  if (!session) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
    timeout: 10000,
  };
};

export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await axios.get<ProfileResponse>(
    `${API_BASE_URL}/profile`,
    await getAuthenticatedConfig(),
  );

  return response.data;
};

export const getGitHubPortfolio = async (): Promise<GitHubPortfolio> => {
  const response = await axios.get<{ github: GitHubPortfolio }>(
    `${API_BASE_URL}/profile/github-portfolio`,
    await getAuthenticatedConfig(),
  );
  return response.data.github;
};

export const updateProfile = async (
  profileData: CommonProfileInput,
): Promise<CommonProfile> => {
  const response = await axios.put<{ success: boolean; profile: CommonProfile }>(
    `${API_BASE_URL}/profile`,
    profileData,
    await getAuthenticatedConfig(),
  );

  return response.data.profile;
};
export const updateRecruiterProfile=async(company_id:number,job_title:string)=>{const response=await axios.put<{recruiter_profile:RecruiterProfile}>(`${API_BASE_URL}/profile/recruiter`,{company_id,job_title},await getAuthenticatedConfig());return response.data.recruiter_profile;};

export const getProfileErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Unable to reach the profile service. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load your profile. Please try again.";
};
