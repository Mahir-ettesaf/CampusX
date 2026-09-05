import {
  createAcademicResource,
  deleteAcademicResource,
  findAcademicResource,
  listAcademicResources,
  updateAcademicResource,
} from "../models/academic-resource.model.js";
import { PortfolioUploadError, storePortfolioFile } from "../services/portfolio-upload.service.js";

const RESOURCE_TYPES = new Set(["lecture_notes", "slides", "lab_manual", "previous_questions", "research_material", "other"]);
const STATUSES = new Set(["draft", "published", "archived"]);
const EDITABLE_FIELDS = new Set(["title", "description", "resource_type", "subject", "resource_url", "status"]);
const IDENTITY_FIELDS = new Set(["created_by", "creator_user_id", "uploader_user_id", "user_id", "role", "approved_by", "jwt", "password"]);
const APPLICANT_ROLES = new Set(["student", "graduate"]);
const MANAGEMENT_ROLES = new Set(["faculty", "admin"]);

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const internal = (res) => fail(res, 500, "Unable to process the academic resource request");
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const getId = (value) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; };
const validUrl = (value) => { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } };
const safeResource = ({ id, title, description, resource_type, subject, resource_url, creator_name, status, created_at, updated_at }) => ({ id, title, description, resource_type, subject, resource_url, creator_name, status, created_at, updated_at });

const textFilter = (value, label, maximum) => {
  if (value === undefined) return { value: undefined };
  if (typeof value !== "string" || value.trim().length > maximum) return { error: `${label} must be text and ${maximum} characters or fewer` };
  return { value: value.trim() || undefined };
};

const validateFilters = (query) => {
  const type = textFilter(query.resource_type, "Resource type", 50);
  const subject = textFilter(query.subject, "Subject", 150);
  const search = textFilter(query.search, "Search text", 150);
  const status = textFilter(query.status, "Status", 20);
  if (type.error || subject.error || search.error || status.error) return { error: type.error || subject.error || search.error || status.error };
  if (type.value && !RESOURCE_TYPES.has(type.value)) return { error: "Provide a valid resource type filter" };
  if (status.value && !STATUSES.has(status.value)) return { error: "Provide a valid status filter" };
  return { filters: { resourceType: type.value, subject: subject.value, search: search.value, status: status.value } };
};

const optionalText = (value, label, maximum) => {
  if (value === null) return { value: null };
  if (typeof value !== "string" || value.trim().length > maximum) return { error: `${label} must be text and ${maximum} characters or fewer` };
  return { value: value.trim() || null };
};

const validateResource = (body, required) => {
  if (!isPlainObject(body)) return { error: "Academic resource data must be an object" };
  const keys = Object.keys(body);
  if (keys.some((key) => IDENTITY_FIELDS.has(key))) return { error: "Identity fields cannot be provided for an academic resource" };
  if (keys.some((key) => !EDITABLE_FIELDS.has(key))) return { error: "The request contains an unsupported academic resource field" };
  if (!required && keys.length === 0) return { error: "Provide at least one academic resource field to update" };

  const data = {};
  if (required || Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || !body.title.trim()) return { error: "Resource title is required" };
    if (body.title.trim().length > 200) return { error: "Resource title must be 200 characters or fewer" };
    data.title = body.title.trim();
  }
  if (required || Object.hasOwn(body, "resource_type")) {
    if (typeof body.resource_type !== "string" || !RESOURCE_TYPES.has(body.resource_type.toLowerCase())) return { error: "Provide a valid resource type" };
    data.resource_type = body.resource_type.toLowerCase();
  }
  for (const [field, label, maximum] of [["description", "Description", 5000], ["subject", "Subject", 150]]) {
    if (Object.hasOwn(body, field)) {
      const normalized = optionalText(body[field], label, maximum);
      if (normalized.error) return normalized;
      data[field] = normalized.value;
    } else if (required) data[field] = null;
  }
  if (Object.hasOwn(body, "resource_url")) {
    if (body.resource_url === null) data.resource_url = null;
    else if (typeof body.resource_url !== "string" || body.resource_url.trim().length > 2048 || !validUrl(body.resource_url.trim())) return { error: "Resource URL must be a valid http or https URL" };
    else data.resource_url = body.resource_url.trim();
  } else if (required) data.resource_url = null;
  if (required || Object.hasOwn(body, "status")) {
    const status = body.status === undefined && required ? "draft" : body.status;
    if (typeof status !== "string" || !STATUSES.has(status.toLowerCase())) return { error: "Resource status must be draft, published, or archived" };
    data.status = status.toLowerCase();
  }
  return { data };
};

const canManage = (req, resource) => req.user.role === "admin" || resource.created_by === req.user.id;

export const listResources = async (req, res) => {
  const validated = validateFilters(req.query);
  if (validated.error) return fail(res, 400, validated.error);
  const { filters } = validated;
  if (!APPLICANT_ROLES.has(req.user.role) && !MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "You are not allowed to view academic resources");
  if (APPLICANT_ROLES.has(req.user.role) && filters.status && filters.status !== "published") return fail(res, 403, "Students and graduates can only view published resources");

  try {
    const scope = APPLICANT_ROLES.has(req.user.role)
      ? { ...filters, status: "published" }
      : req.user.role === "faculty"
        ? { ...filters, createdBy: req.user.id }
        : filters;
    return res.json({ success: true, resources: (await listAcademicResources(scope)).map(safeResource) });
  } catch {
    return internal(res);
  }
};

export const getResource = async (req, res) => {
  const resourceId = getId(req.params.resourceId);
  if (!resourceId) return fail(res, 400, "Provide a valid resource ID");
  if (!APPLICANT_ROLES.has(req.user.role) && !MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "You are not allowed to view academic resources");
  try {
    const resource = await findAcademicResource(resourceId);
    if (!resource || (APPLICANT_ROLES.has(req.user.role) && resource.status !== "published") || (req.user.role === "faculty" && resource.created_by !== req.user.id)) return fail(res, 404, "Academic resource was not found");
    return res.json({ success: true, resource: safeResource(resource) });
  } catch {
    return internal(res);
  }
};

export const createResource = async (req, res) => {
  if (!MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "Only faculty and administrators can create academic resources");
  const validated = validateResource(req.body, true);
  if (validated.error) return fail(res, 400, validated.error);
  try {
    const resource = await createAcademicResource(req.user.id, validated.data);
    return res.status(201).json({ success: true, message: "Academic resource created successfully", resource: safeResource(resource) });
  } catch {
    return internal(res);
  }
};

export const updateResource = async (req, res) => {
  const resourceId = getId(req.params.resourceId);
  if (!resourceId) return fail(res, 400, "Provide a valid resource ID");
  if (!MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "Only faculty and administrators can update academic resources");
  try {
    const resource = await findAcademicResource(resourceId);
    if (!resource || !canManage(req, resource)) return fail(res, 404, "Academic resource was not found");
    const validated = validateResource(req.body, false);
    if (validated.error) return fail(res, 400, validated.error);
    return res.json({ success: true, message: "Academic resource updated successfully", resource: safeResource(await updateAcademicResource(resourceId, validated.data)) });
  } catch {
    return internal(res);
  }
};

export const deleteResource = async (req, res) => {
  const resourceId = getId(req.params.resourceId);
  if (!resourceId) return fail(res, 400, "Provide a valid resource ID");
  if (!MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "Only faculty and administrators can delete academic resources");
  try {
    const resource = await findAcademicResource(resourceId);
    if (!resource || !canManage(req, resource)) return fail(res, 404, "Academic resource was not found");
    await deleteAcademicResource(resourceId);
    return res.json({ success: true, message: "Academic resource deleted successfully" });
  } catch {
    return internal(res);
  }
};

export const uploadResourceFile = async (req, res) => { const resourceId = getId(req.params.resourceId); if (!resourceId) return fail(res, 400, "Provide a valid resource ID"); if (!MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "Only faculty and administrators can upload academic resources"); try { const resource = await findAcademicResource(resourceId); if (!resource || !canManage(req, resource)) return fail(res, 404, "Academic resource was not found"); const resource_url = await storePortfolioFile(req.file, `resources/user-${req.user.id}`, resourceId); return res.json({ success: true, message: "Academic resource file uploaded successfully", resource: safeResource(await updateAcademicResource(resourceId, { resource_url })) }); } catch (error) { return fail(res, error instanceof PortfolioUploadError ? error.status : 500, error instanceof PortfolioUploadError ? error.message : "Unable to upload the academic resource file"); } };
