import {
  createPlannerItem,
  deletePlannerItem,
  findPlannerItem,
  findPlannerItems,
  updatePlannerItem,
} from "../models/planner-item.model.js";

const ALLOWED_ROLES = new Set(["student", "graduate"]);
const TYPES = new Set(["assignment", "exam", "meeting", "personal", "thesis_research"]);
const STATUSES = new Set(["pending", "completed", "cancelled"]);
const PRIORITIES = new Set(["low", "medium", "high"]);
const EDITABLE_FIELDS = new Set(["title", "description", "item_type", "due_at", "status", "priority"]);
const IDENTITY_FIELDS = new Set(["user_id", "owner_id", "email", "role", "jwt", "token", "password", "created_by"]);
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?$/;

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const internal = (res) => fail(res, 500, "Unable to process the planner request");
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const getId = (value) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; };
const enumValue = (value) => typeof value === "string" ? value.trim().toLowerCase() : null;

const validDateOnly = (value) => {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const normalizeDateTime = (value) => {
  if (typeof value !== "string") return null;
  const match = value.trim().match(DATE_TIME);
  if (!match || !validDateOnly(match[1])) return null;
  const seconds = match[3] || "00";
  const date = new Date(`${match[1]}T${match[2]}:${seconds}.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1] || date.toISOString().slice(11, 19) !== `${match[2]}:${seconds}`) return null;
  return `${match[1]} ${match[2]}:${seconds}`;
};

const normalizeDateBoundary = (value, isEnd) => {
  if (validDateOnly(value)) return `${value} ${isEnd ? "23:59:59" : "00:00:00"}`;
  return normalizeDateTime(value);
};

const optionalText = (value, label, maximum) => {
  if (value === null) return { value: null };
  if (typeof value !== "string" || value.trim().length > maximum) return { error: `${label} must be text and ${maximum} characters or fewer` };
  return { value: value.trim() || null };
};

const validateItem = (body, required) => {
  if (!isPlainObject(body)) return { error: "Planner item data must be an object" };
  const keys = Object.keys(body);
  if (keys.some((key) => IDENTITY_FIELDS.has(key))) return { error: "User identity fields cannot be provided for a planner item" };
  if (keys.some((key) => !EDITABLE_FIELDS.has(key))) return { error: "The request contains an unsupported planner item field" };
  if (!required && keys.length === 0) return { error: "Provide at least one planner item field to update" };
  const data = {};
  if (required || Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || !body.title.trim()) return { error: "Planner item title is required" };
    if (body.title.trim().length > 200) return { error: "Planner item title must be 200 characters or fewer" };
    data.title = body.title.trim();
  }
  if (Object.hasOwn(body, "description")) {
    const normalized = optionalText(body.description, "Description", 5000);
    if (normalized.error) return normalized;
    data.description = normalized.value;
  } else if (required) data.description = null;
  if (required || Object.hasOwn(body, "item_type")) {
    const value = enumValue(body.item_type);
    if (!value || !TYPES.has(value)) return { error: "Planner item type must be assignment, exam, meeting, personal, or thesis_research" };
    data.item_type = value;
  }
  if (required || Object.hasOwn(body, "due_at")) {
    const value = normalizeDateTime(body.due_at);
    if (!value) return { error: "Due date and time must be valid in YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm format" };
    data.due_at = value;
  }
  if (required || Object.hasOwn(body, "status")) {
    const value = body.status === undefined && required ? "pending" : enumValue(body.status);
    if (!value || !STATUSES.has(value)) return { error: "Planner item status must be pending, completed, or cancelled" };
    data.status = value;
  }
  if (required || Object.hasOwn(body, "priority")) {
    const value = body.priority === undefined && required ? "medium" : enumValue(body.priority);
    if (!value || !PRIORITIES.has(value)) return { error: "Planner item priority must be low, medium, or high" };
    data.priority = value;
  }
  return { data };
};

const validateFilters = (query) => {
  const itemType = query.item_type === undefined ? undefined : enumValue(query.item_type);
  const status = query.status === undefined ? undefined : enumValue(query.status);
  if (query.item_type !== undefined && (!itemType || !TYPES.has(itemType))) return { error: "Provide a valid planner item type filter" };
  if (query.status !== undefined && (!status || !STATUSES.has(status))) return { error: "Provide a valid planner item status filter" };
  if (query.upcoming !== undefined && query.upcoming !== "true") return { error: "Upcoming filter must be true when provided" };
  const dueFrom = query.due_from === undefined ? undefined : normalizeDateBoundary(query.due_from, false);
  const dueTo = query.due_to === undefined ? undefined : normalizeDateBoundary(query.due_to, true);
  if (query.due_from !== undefined && !dueFrom) return { error: "Due-from date must be a valid date or date-time" };
  if (query.due_to !== undefined && !dueTo) return { error: "Due-to date must be a valid date or date-time" };
  if (dueFrom && dueTo && dueFrom > dueTo) return { error: "Due-from date cannot be after due-to date" };
  return { filters: { itemType, status, dueFrom, dueTo, upcoming: query.upcoming === "true" } };
};

const requirePlannerRole = (req, res) => {
  if (!ALLOWED_ROLES.has(req.user.role)) {
    fail(res, 403, "Planner is available to Student and Graduate users only");
    return false;
  }
  return true;
};

export const listMyPlannerItems = async (req, res) => {
  if (!requirePlannerRole(req, res)) return;
  const validated = validateFilters(req.query);
  if (validated.error) return fail(res, 400, validated.error);
  try { return res.json({ success: true, items: await findPlannerItems({ userId: req.user.id, ...validated.filters }) }); } catch { return internal(res); }
};

export const getMyPlannerItem = async (req, res) => {
  if (!requirePlannerRole(req, res)) return;
  const itemId = getId(req.params.itemId);
  if (!itemId) return fail(res, 400, "Provide a valid planner item ID");
  try { const item = await findPlannerItem(req.user.id, itemId); return item ? res.json({ success: true, item }) : fail(res, 404, "Planner item was not found"); } catch { return internal(res); }
};

export const createMyPlannerItem = async (req, res) => {
  if (!requirePlannerRole(req, res)) return;
  const validated = validateItem(req.body, true);
  if (validated.error) return fail(res, 400, validated.error);
  try { return res.status(201).json({ success: true, message: "Planner item created successfully", item: await createPlannerItem(req.user.id, validated.data) }); } catch { return internal(res); }
};

export const updateMyPlannerItem = async (req, res) => {
  if (!requirePlannerRole(req, res)) return;
  const itemId = getId(req.params.itemId);
  if (!itemId) return fail(res, 400, "Provide a valid planner item ID");
  try { if (!await findPlannerItem(req.user.id, itemId)) return fail(res, 404, "Planner item was not found"); const validated = validateItem(req.body, false); if (validated.error) return fail(res, 400, validated.error); return res.json({ success: true, message: "Planner item updated successfully", item: await updatePlannerItem(req.user.id, itemId, validated.data) }); } catch { return internal(res); }
};

export const deleteMyPlannerItem = async (req, res) => {
  if (!requirePlannerRole(req, res)) return;
  const itemId = getId(req.params.itemId);
  if (!itemId) return fail(res, 400, "Provide a valid planner item ID");
  try { const result = await deletePlannerItem(req.user.id, itemId); return result.affectedRows ? res.json({ success: true, message: "Planner item deleted successfully" }) : fail(res, 404, "Planner item was not found"); } catch { return internal(res); }
};
