import {
  createAnnouncement,
  deleteAnnouncement,
  findAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../models/announcement.model.js";
import { createNotificationsForAudience } from "../models/notification.model.js";

const TYPES = new Set(["academic", "assignment", "general"]);
const AUDIENCES = new Set(["student", "graduate", "faculty", "recruiter", "all"]);
const STATUSES = new Set(["draft", "published", "archived"]);
const APPLICANT_ROLES = new Set(["student", "graduate"]);
const MANAGEMENT_ROLES = new Set(["faculty", "admin"]);
const EDITABLE_FIELDS = new Set(["title", "content", "announcement_type", "audience", "status"]);
const IDENTITY_FIELDS = new Set(["created_by", "creator_user_id", "user_id", "owner_id", "email", "role", "approved_by", "jwt", "token", "password"]);

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const internal = (res) => fail(res, 500, "Unable to process the announcement request");
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const getId = (value) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; };
const normalizeEnum = (value) => typeof value === "string" ? value.trim().toLowerCase() : null;
const safeAnnouncement = ({ id, title, content, announcement_type, audience, status, published_at, created_at, updated_at, creator_name }) => ({ id, title, content, announcement_type, audience, status, published_at, created_at, updated_at, creator_name });

const textFilter = (value, label, maximum) => {
  if (value === undefined) return { value: undefined };
  if (typeof value !== "string" || value.trim().length > maximum) return { error: `${label} must be text and ${maximum} characters or fewer` };
  return { value: value.trim() || undefined };
};

const validateFilters = (query) => {
  const announcementType = textFilter(query.announcement_type, "Announcement type", 20);
  const audience = textFilter(query.audience, "Audience", 20);
  const status = textFilter(query.status, "Status", 20);
  const search = textFilter(query.search, "Search text", 150);
  if (announcementType.error || audience.error || status.error || search.error) return { error: announcementType.error || audience.error || status.error || search.error };
  if (announcementType.value && !TYPES.has(announcementType.value)) return { error: "Provide a valid announcement type filter" };
  if (audience.value && !AUDIENCES.has(audience.value)) return { error: "Provide a valid audience filter" };
  if (status.value && !STATUSES.has(status.value)) return { error: "Provide a valid status filter" };
  return { filters: { announcementType: announcementType.value, audience: audience.value, status: status.value, search: search.value } };
};

const validAudienceForRole = (role, audience) => role === "admin" || audience === "student" || audience === "graduate";

const validateAnnouncement = (body, required) => {
  if (!isPlainObject(body)) return { error: "Announcement data must be an object" };
  const keys = Object.keys(body);
  if (keys.some((key) => IDENTITY_FIELDS.has(key))) return { error: "Identity fields cannot be provided for an announcement" };
  if (keys.some((key) => !EDITABLE_FIELDS.has(key))) return { error: "The request contains an unsupported announcement field" };
  if (!required && keys.length === 0) return { error: "Provide at least one announcement field to update" };

  const data = {};
  if (required || Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || !body.title.trim()) return { error: "Announcement title is required" };
    if (body.title.trim().length > 200) return { error: "Announcement title must be 200 characters or fewer" };
    data.title = body.title.trim();
  }
  if (required || Object.hasOwn(body, "content")) {
    if (typeof body.content !== "string" || !body.content.trim()) return { error: "Announcement content is required" };
    if (body.content.trim().length > 5000) return { error: "Announcement content must be 5000 characters or fewer" };
    data.content = body.content.trim();
  }
  if (required || Object.hasOwn(body, "announcement_type")) {
    const value = normalizeEnum(body.announcement_type);
    if (!value || !TYPES.has(value)) return { error: "Announcement type must be academic, assignment, or general" };
    data.announcement_type = value;
  }
  if (required || Object.hasOwn(body, "audience")) {
    const value = normalizeEnum(body.audience);
    if (!value || !AUDIENCES.has(value)) return { error: "Provide a valid announcement audience" };
    data.audience = value;
  }
  if (required || Object.hasOwn(body, "status")) {
    const value = body.status === undefined && required ? "draft" : normalizeEnum(body.status);
    if (!value || !STATUSES.has(value)) return { error: "Announcement status must be draft, published, or archived" };
    data.status = value;
  }
  return { data };
};

const canManage = (req, announcement) => req.user.role === "admin" || announcement.created_by === req.user.id;
const isVisibleTo = (role, announcement) => announcement.status === "published" && (announcement.audience === "all" || announcement.audience === role);
const notifyPublication = (announcement) => createNotificationsForAudience(announcement.audience, { notification_type: "announcement", title: "New Announcement", message: `${announcement.title} has been published.`, related_entity_type: "announcement", related_entity_id: announcement.id }).catch(() => undefined);

export const listAnnouncementsForUser = async (req, res) => {
  const validated = validateFilters(req.query);
  if (validated.error) return fail(res, 400, validated.error);
  const { filters } = validated;
  const { role } = req.user;
  if (!APPLICANT_ROLES.has(role) && role !== "faculty" && role !== "admin" && role !== "recruiter") return fail(res, 403, "You are not allowed to view announcements");
  if ((APPLICANT_ROLES.has(role) || role === "recruiter") && filters.status && filters.status !== "published") return fail(res, 403, "You can only view published announcements");
  if ((APPLICANT_ROLES.has(role) || role === "recruiter") && filters.audience && filters.audience !== role && filters.audience !== "all") return fail(res, 403, "You are not allowed to view that announcement audience");

  try {
    const scope = role === "admin"
      ? filters
      : role === "faculty"
        ? { ...filters, createdBy: req.user.id }
        : { ...filters, status: "published", audience: filters.audience || [role, "all"] };
    return res.json({ success: true, announcements: (await listAnnouncements(scope)).map(safeAnnouncement) });
  } catch {
    return internal(res);
  }
};

export const getAnnouncementForUser = async (req, res) => {
  const announcementId = getId(req.params.announcementId);
  if (!announcementId) return fail(res, 400, "Provide a valid announcement ID");
  const { role } = req.user;
  if (!APPLICANT_ROLES.has(role) && role !== "faculty" && role !== "admin" && role !== "recruiter") return fail(res, 403, "You are not allowed to view announcements");
  try {
    const announcement = await findAnnouncement(announcementId);
    if (!announcement || (role === "faculty" && announcement.created_by !== req.user.id) || ((APPLICANT_ROLES.has(role) || role === "recruiter") && !isVisibleTo(role, announcement))) return fail(res, 404, "Announcement was not found");
    return res.json({ success: true, announcement: safeAnnouncement(announcement) });
  } catch {
    return internal(res);
  }
};

export const createAnnouncementForUser = async (req, res) => {
  if (!MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "Only faculty and administrators can create announcements");
  const validated = validateAnnouncement(req.body, true);
  if (validated.error) return fail(res, 400, validated.error);
  if (!validAudienceForRole(req.user.role, validated.data.audience)) return fail(res, 403, "Faculty announcements may target students or graduates only");
  validated.data.published_at = validated.data.status === "published" ? new Date() : null;
  try {
    const announcement = await createAnnouncement(req.user.id, validated.data);
    if (announcement.status === "published") await notifyPublication(announcement);
    return res.status(201).json({ success: true, message: "Announcement created successfully", announcement: safeAnnouncement(announcement) });
  } catch {
    return internal(res);
  }
};

export const updateAnnouncementForUser = async (req, res) => {
  const announcementId = getId(req.params.announcementId);
  if (!announcementId) return fail(res, 400, "Provide a valid announcement ID");
  if (!MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "Only faculty and administrators can update announcements");
  try {
    const announcement = await findAnnouncement(announcementId);
    if (!announcement || !canManage(req, announcement)) return fail(res, 404, "Announcement was not found");
    const validated = validateAnnouncement(req.body, false);
    if (validated.error) return fail(res, 400, validated.error);
    const audience = validated.data.audience || announcement.audience;
    if (!validAudienceForRole(req.user.role, audience)) return fail(res, 403, "Faculty announcements may target students or graduates only");
    if (validated.data.status === "published" && announcement.status !== "published") validated.data.published_at = new Date();
    const becamePublished = validated.data.status === "published" && announcement.status !== "published";
    const updated = await updateAnnouncement(announcementId, validated.data);
    if (becamePublished) await notifyPublication(updated);
    return res.json({ success: true, message: "Announcement updated successfully", announcement: safeAnnouncement(updated) });
  } catch {
    return internal(res);
  }
};

export const deleteAnnouncementForUser = async (req, res) => {
  const announcementId = getId(req.params.announcementId);
  if (!announcementId) return fail(res, 400, "Provide a valid announcement ID");
  if (!MANAGEMENT_ROLES.has(req.user.role)) return fail(res, 403, "Only faculty and administrators can delete announcements");
  try {
    const announcement = await findAnnouncement(announcementId);
    if (!announcement || !canManage(req, announcement)) return fail(res, 404, "Announcement was not found");
    await deleteAnnouncement(announcementId);
    return res.json({ success: true, message: "Announcement deleted successfully" });
  } catch {
    return internal(res);
  }
};
