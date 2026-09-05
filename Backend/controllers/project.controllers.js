import {
  createUserProject,
  deleteUserProject,
  findUserProject,
  findUserProjects,
  updateUserProject,
} from "../models/project.model.js";
import { PortfolioUploadError, storePortfolioFile } from "../services/portfolio-upload.service.js";

const EDITABLE_FIELDS = new Set([
  "title",
  "description",
  "project_type",
  "start_date",
  "end_date",
  "project_url",
  "github_url",
  "technologies",
]);
const IDENTITY_FIELDS = new Set(["user_id", "owner_id", "email", "role"]);
const PROJECT_TYPES = new Set(["academic", "professional", "personal"]);
const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 2048;
const MAX_TECHNOLOGIES_LENGTH = 2000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const getProjectId = (value) => {
  const projectId = Number(value);
  return Number.isInteger(projectId) && projectId > 0 ? projectId : null;
};

const isValidDate = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const toDateString = (value) => {
  if (typeof value === "string") return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return null;
};

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeRequiredText = (value, fieldName, maximumLength) => {
  if (typeof value !== "string" || !value.trim()) return { error: `${fieldName} is required` };
  if (value.trim().length > maximumLength) return { error: `${fieldName} must be ${maximumLength} characters or fewer` };
  return { value: value.trim() };
};

const normalizeOptionalText = (value, fieldName, maximumLength) => {
  if (value === null) return { value: null };
  if (typeof value !== "string") return { error: `${fieldName} must be text` };
  if (value.trim().length > maximumLength) return { error: `${fieldName} must be ${maximumLength} characters or fewer` };
  return { value: value.trim() || null };
};

const validateProjectData = (body, { requireFields, existingProject = null }) => {
  if (!isPlainObject(body)) return { error: "Project data must be an object" };

  const keys = Object.keys(body);
  if (keys.some((key) => IDENTITY_FIELDS.has(key))) return { error: "User identity fields cannot be provided for a project" };
  if (keys.some((key) => !EDITABLE_FIELDS.has(key))) return { error: "The request contains an unsupported project field" };
  if (!requireFields && keys.length === 0) return { error: "Provide at least one project field to update" };

  const data = {};
  if (requireFields || Object.hasOwn(body, "title")) {
    const normalized = normalizeRequiredText(body.title, "Project title", MAX_TITLE_LENGTH);
    if (normalized.error) return normalized;
    data.title = normalized.value;
  }

  if (requireFields || Object.hasOwn(body, "project_type")) {
    if (typeof body.project_type !== "string" || !PROJECT_TYPES.has(body.project_type.toLowerCase())) {
      return { error: "Project type must be academic, professional, or personal" };
    }
    data.project_type = body.project_type.toLowerCase();
  }

  for (const [field, label, limit] of [
    ["description", "Description", MAX_DESCRIPTION_LENGTH],
    ["technologies", "Technologies", MAX_TECHNOLOGIES_LENGTH],
  ]) {
    if (Object.hasOwn(body, field)) {
      const normalized = normalizeOptionalText(body[field], label, limit);
      if (normalized.error) return normalized;
      data[field] = normalized.value;
    } else if (requireFields) {
      data[field] = null;
    }
  }

  for (const field of ["start_date", "end_date"]) {
    if (Object.hasOwn(body, field)) {
      if (body[field] !== null && !isValidDate(body[field])) {
        return { error: `${field === "start_date" ? "Start" : "End"} date must be a valid date in YYYY-MM-DD format` };
      }
      data[field] = body[field];
    } else if (requireFields) {
      data[field] = null;
    }
  }

  for (const field of ["project_url", "github_url"]) {
    if (Object.hasOwn(body, field)) {
      if (body[field] === null) {
        data[field] = null;
      } else if (typeof body[field] !== "string" || body[field].trim().length > MAX_URL_LENGTH || !isValidHttpUrl(body[field].trim())) {
        return { error: `${field === "project_url" ? "Project" : "GitHub"} URL must be a valid http or https URL` };
      } else {
        data[field] = body[field].trim();
      }
    } else if (requireFields) {
      data[field] = null;
    }
  }

  const startDate = toDateString(Object.hasOwn(data, "start_date") ? data.start_date : existingProject?.start_date);
  const endDate = toDateString(Object.hasOwn(data, "end_date") ? data.end_date : existingProject?.end_date);
  if (startDate && endDate && endDate < startDate) return { error: "End date cannot be earlier than start date" };

  return { data };
};

const respondInternalError = (res) =>
  res.status(500).json({ success: false, message: "Unable to process the project request" });

export const getMyProjects = async (req, res) => {
  try {
    const projects = await findUserProjects(req.user.id);
    return res.status(200).json({ success: true, projects });
  } catch {
    return respondInternalError(res);
  }
};

export const createMyProject = async (req, res) => {
  const validation = validateProjectData(req.body, { requireFields: true });
  if (validation.error) return res.status(400).json({ success: false, message: validation.error });

  try {
    const project = await createUserProject(req.user.id, validation.data);
    return res.status(201).json({ success: true, message: "Project created successfully", project });
  } catch {
    return respondInternalError(res);
  }
};

export const updateMyProject = async (req, res) => {
  const projectId = getProjectId(req.params.projectId);
  if (!projectId) return res.status(400).json({ success: false, message: "Provide a valid project ID" });

  try {
    const existingProject = await findUserProject(req.user.id, projectId);
    if (!existingProject) return res.status(404).json({ success: false, message: "Project was not found" });

    const validation = validateProjectData(req.body, { requireFields: false, existingProject });
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    const project = await updateUserProject(req.user.id, projectId, validation.data);
    return res.status(200).json({ success: true, message: "Project updated successfully", project });
  } catch {
    return respondInternalError(res);
  }
};

export const deleteMyProject = async (req, res) => {
  const projectId = getProjectId(req.params.projectId);
  if (!projectId) return res.status(400).json({ success: false, message: "Provide a valid project ID" });

  try {
    const result = await deleteUserProject(req.user.id, projectId);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Project was not found" });
    return res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch {
    return respondInternalError(res);
  }
};

export const uploadMyProjectFile = async (req, res) => { const projectId = getProjectId(req.params.projectId); if (!projectId) return res.status(400).json({ success: false, message: "Provide a valid project ID" }); try { if (!await findUserProject(req.user.id, projectId)) return res.status(404).json({ success: false, message: "Project was not found" }); const project_url = await storePortfolioFile(req.file, `projects/user-${req.user.id}`, projectId); const project = await updateUserProject(req.user.id, projectId, { project_url }); return res.json({ success: true, message: "Project evidence uploaded successfully", project }); } catch (error) { return res.status(error instanceof PortfolioUploadError ? error.status : 500).json({ success: false, message: error instanceof PortfolioUploadError ? error.message : "Unable to upload the project evidence" }); } };
