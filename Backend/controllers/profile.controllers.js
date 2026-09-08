import {
  approvedCompanyExists,
  findAcademicProfile,
  findCommonProfile,
  findFacultyProfile,
  findRecruiterProfile,
  findUserProfile,
  updateUserProfilePicture,
  upsertAcademicProfile,
  upsertCommonProfile,
  upsertFacultyProfile,
  upsertRecruiterProfile,
} from "../models/profile.model.js";
import { GitHubApiError, getPublicGitHubPortfolio } from "../services/github.service.js";
import { PortfolioUploadError, storePortfolioFile } from "../services/portfolio-upload.service.js";

const COMMON_PROFILE_FIELDS = [
  "headline",
  "bio",
  "phone",
  "location",
  "linkedin_url",
  "github_username",
  "portfolio_url",
];

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const hasOnlyFields = (body, allowedFields) =>
  Object.keys(body).every((field) => allowedFields.includes(field));

const respondInternalError = (res) =>
  res.status(500).json({ success: false, message: "Unable to process the profile request" });

export const getProfile = async (req, res) => {
  try {
    const user = await findUserProfile(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User account was not found" });
    }

    const profile = await findCommonProfile(req.user.id);
    const response = { success: true, user, profile };

    if (req.user.role === "student" || req.user.role === "graduate") {
      response.academic_profile = await findAcademicProfile(req.user.id);
    }

    if (req.user.role === "faculty") {
      response.faculty_profile = await findFacultyProfile(req.user.id);
    }

    if (req.user.role === "recruiter") {
      response.recruiter_profile = await findRecruiterProfile(req.user.id);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Profile fetch failed:", error?.code || error?.message || error);
    return respondInternalError(res);
  }
};

export const getGitHubPortfolio = async (req, res) => {
  if (req.user.role !== "student" && req.user.role !== "graduate") {
    return res.status(403).json({ success: false, message: "GitHub portfolio is available to students and graduates only" });
  }

  try {
    const profile = await findCommonProfile(req.user.id);
    const username = profile?.github_username?.trim();
    if (!username) {
      return res.status(400).json({ success: false, message: "Add a GitHub username to your profile before loading your portfolio" });
    }
    if (!/^[A-Za-z\d](?:[A-Za-z\d]|-(?=[A-Za-z\d])){0,38}$/.test(username)) {
      return res.status(400).json({ success: false, message: "Your saved GitHub username is invalid" });
    }

    return res.status(200).json({
      success: true,
      github: await getPublicGitHubPortfolio(username),
    });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Unable to load the GitHub portfolio" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (Object.hasOwn(req.body, "email")) {
      return res.status(400).json({ success: false, message: "Email cannot be updated through the profile" });
    }

    if (!hasOnlyFields(req.body, COMMON_PROFILE_FIELDS)) {
      return res.status(400).json({ success: false, message: "Profile request contains unsupported fields" });
    }

    const profileData = {};
    for (const field of COMMON_PROFILE_FIELDS) {
      if (!Object.hasOwn(req.body, field)) {
        continue;
      }

      const value = req.body[field];
      if (value !== null && typeof value !== "string") {
        return res.status(400).json({ success: false, message: `${field} must be text` });
      }

      profileData[field] = value === null ? null : value.trim();
    }

    if (Object.keys(profileData).length === 0) {
      return res.status(400).json({ success: false, message: "Provide at least one profile field to update" });
    }

    for (const urlField of ["linkedin_url", "portfolio_url"]) {
      if (profileData[urlField] && !isHttpUrl(profileData[urlField])) {
        return res.status(400).json({ success: false, message: `${urlField} must be a valid HTTP or HTTPS URL` });
      }
    }

    const profile = await upsertCommonProfile(req.user.id, profileData);
    return res.status(200).json({ success: true, message: "Profile updated successfully", profile });
  } catch {
    return respondInternalError(res);
  }
};

export const uploadProfilePicture = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Choose a JPG or PNG profile photo." });

  try {
    const profile_picture = await storePortfolioFile(req.file, `profile-images/user-${req.user.id}`, req.user.id);
    const user = await updateUserProfilePicture(req.user.id, profile_picture);
    return res.status(200).json({ success: true, message: "Profile photo updated successfully", user });
  } catch (error) {
    const status = error instanceof PortfolioUploadError ? error.status : 500;
    const message = error instanceof PortfolioUploadError ? error.message : "Unable to upload the profile photo";
    return res.status(status).json({ success: false, message });
  }
};

export const updateAcademicProfile = async (req, res) => {
  if (req.user.role !== "student" && req.user.role !== "graduate") {
    return res.status(403).json({ success: false, message: "Only student and graduate users can update an academic profile" });
  }

  const expectedDegreeLevel = req.user.role === "graduate" ? "graduate" : "undergraduate";
  const { student_id, department, program, degree_level, graduation_year, cgpa, interests } = req.body;

  if (!isNonEmptyString(student_id) || !isNonEmptyString(department) || !isNonEmptyString(program)) {
    return res.status(400).json({ success: false, message: "Student ID, department, and program are required" });
  }

  if (degree_level && degree_level !== expectedDegreeLevel) {
    return res.status(403).json({ success: false, message: "Degree level must match the authenticated user role" });
  }

  const currentYear = new Date().getFullYear();
  const normalizedYear = Number(graduation_year);
  if (!Number.isInteger(normalizedYear) || normalizedYear < currentYear - 100 || normalizedYear > currentYear + 15) {
    return res.status(400).json({ success: false, message: "Provide a valid graduation year" });
  }

  const normalizedCgpa = Number(cgpa);
  if (!Number.isFinite(normalizedCgpa) || normalizedCgpa < 0 || normalizedCgpa > 4) {
    return res.status(400).json({ success: false, message: "CGPA must be between 0.00 and 4.00" });
  }

  try {
    const academicProfile = await upsertAcademicProfile(req.user.id, {
      student_id: student_id.trim(),
      department: department.trim(),
      program: program.trim(),
      degree_level: expectedDegreeLevel,
      graduation_year: normalizedYear,
      cgpa: normalizedCgpa,
      interests: typeof interests === "string" ? interests.trim() : null,
    });

    return res.status(200).json({ success: true, message: "Academic profile updated successfully", academic_profile: academicProfile });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "This student ID is already in use" });
    }

    return respondInternalError(res);
  }
};

export const updateFacultyProfile = async (req, res) => {
  if (req.user.role !== "faculty") {
    return res.status(403).json({ success: false, message: "Only faculty users can update a faculty profile" });
  }

  const { department, designation, research_areas, office_location, contact_details } = req.body;
  if (!isNonEmptyString(department) || !isNonEmptyString(designation)) {
    return res.status(400).json({ success: false, message: "Department and designation are required" });
  }

  try {
    const facultyProfile = await upsertFacultyProfile(req.user.id, {
      department: department.trim(),
      designation: designation.trim(),
      research_areas: typeof research_areas === "string" ? research_areas.trim() : null,
      office_location: typeof office_location === "string" ? office_location.trim() : null,
      contact_details: typeof contact_details === "string" ? contact_details.trim() : null,
    });

    return res.status(200).json({ success: true, message: "Faculty profile updated successfully", faculty_profile: facultyProfile });
  } catch {
    return respondInternalError(res);
  }
};

export const updateRecruiterProfile = async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ success: false, message: "Only recruiter users can update a recruiter profile" });
  }

  const { company_id, job_title } = req.body;
  const normalizedCompanyId = Number(company_id);
  if (!Number.isInteger(normalizedCompanyId) || normalizedCompanyId <= 0 || !isNonEmptyString(job_title)) {
    return res.status(400).json({ success: false, message: "A valid company and job title are required" });
  }

  try {
    if (!(await approvedCompanyExists(normalizedCompanyId))) {
      return res.status(400).json({ success: false, message: "Recruiter profiles can only use an approved company" });
    }

    const recruiterProfile = await upsertRecruiterProfile(req.user.id, {
      company_id: normalizedCompanyId,
      job_title: job_title.trim(),
    });

    return res.status(200).json({ success: true, message: "Recruiter profile updated successfully", recruiter_profile: recruiterProfile });
  } catch {
    return respondInternalError(res);
  }
};
