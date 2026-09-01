import {
  createUserCertificate,
  deleteUserCertificate,
  findUserCertificate,
  findUserCertificates,
  updateUserCertificate,
} from "../models/certificate.model.js";

const EDITABLE_FIELDS = new Set([
  "title",
  "issuing_organization",
  "issue_date",
  "expiry_date",
  "credential_id",
  "credential_url",
  "description",
]);
const IDENTITY_FIELDS = new Set(["user_id", "owner_id", "email", "role"]);
const MAX_TITLE_LENGTH = 150;
const MAX_ORGANIZATION_LENGTH = 150;
const MAX_CREDENTIAL_ID_LENGTH = 150;
const MAX_URL_LENGTH = 2048;
const MAX_DESCRIPTION_LENGTH = 5000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const getCertificateId = (value) => {
  const certificateId = Number(value);
  return Number.isInteger(certificateId) && certificateId > 0 ? certificateId : null;
};

const isValidDate = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const toDateString = (value) => {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
};

const normalizeRequiredText = (value, fieldName, maximumLength) => {
  if (typeof value !== "string" || !value.trim()) {
    return { error: `${fieldName} is required` };
  }
  if (value.trim().length > maximumLength) {
    return { error: `${fieldName} must be ${maximumLength} characters or fewer` };
  }
  return { value: value.trim() };
};

const normalizeOptionalText = (value, fieldName, maximumLength) => {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== "string") {
    return { error: `${fieldName} must be text` };
  }
  if (value.trim().length > maximumLength) {
    return { error: `${fieldName} must be ${maximumLength} characters or fewer` };
  }
  return { value: value.trim() || null };
};

const validateCertificateData = (body, { requireFields, existingCertificate = null }) => {
  if (!isPlainObject(body)) {
    return { error: "Certificate data must be an object" };
  }

  const keys = Object.keys(body);
  if (keys.some((key) => IDENTITY_FIELDS.has(key))) {
    return { error: "User identity fields cannot be provided for a certificate" };
  }
  if (keys.some((key) => !EDITABLE_FIELDS.has(key))) {
    return { error: "The request contains an unsupported certificate field" };
  }
  if (!requireFields && keys.length === 0) {
    return { error: "Provide at least one certificate field to update" };
  }

  const data = {};
  for (const [field, label, limit] of [
    ["title", "Certificate title", MAX_TITLE_LENGTH],
    ["issuing_organization", "Issuing organization", MAX_ORGANIZATION_LENGTH],
  ]) {
    if (requireFields || Object.hasOwn(body, field)) {
      const normalized = normalizeRequiredText(body[field], label, limit);
      if (normalized.error) {
        return normalized;
      }
      data[field] = normalized.value;
    }
  }

  if (requireFields || Object.hasOwn(body, "issue_date")) {
    if (!isValidDate(body.issue_date)) {
      return { error: "Issue date must be a valid date in YYYY-MM-DD format" };
    }
    data.issue_date = body.issue_date;
  }

  if (Object.hasOwn(body, "expiry_date")) {
    if (body.expiry_date !== null && !isValidDate(body.expiry_date)) {
      return { error: "Expiry date must be a valid date in YYYY-MM-DD format" };
    }
    data.expiry_date = body.expiry_date;
  } else if (requireFields) {
    data.expiry_date = null;
  }

  for (const [field, label, limit] of [
    ["credential_id", "Credential ID", MAX_CREDENTIAL_ID_LENGTH],
    ["description", "Description", MAX_DESCRIPTION_LENGTH],
  ]) {
    if (Object.hasOwn(body, field)) {
      const normalized = normalizeOptionalText(body[field], label, limit);
      if (normalized.error) {
        return normalized;
      }
      data[field] = normalized.value;
    } else if (requireFields) {
      data[field] = null;
    }
  }

  if (Object.hasOwn(body, "credential_url")) {
    if (body.credential_url === null) {
      data.credential_url = null;
    } else if (typeof body.credential_url !== "string" || body.credential_url.trim().length > MAX_URL_LENGTH || !isValidHttpUrl(body.credential_url.trim())) {
      return { error: "Credential URL must be a valid http or https URL" };
    } else {
      data.credential_url = body.credential_url.trim();
    }
  } else if (requireFields) {
    data.credential_url = null;
  }

  const issueDate = toDateString(data.issue_date || existingCertificate?.issue_date);
  const expiryDate = toDateString(Object.hasOwn(data, "expiry_date") ? data.expiry_date : existingCertificate?.expiry_date);
  if (expiryDate && issueDate && expiryDate < issueDate) {
    return { error: "Expiry date cannot be earlier than issue date" };
  }

  return { data };
};

const respondInternalError = (res) =>
  res.status(500).json({ success: false, message: "Unable to process the certificate request" });

export const getMyCertificates = async (req, res) => {
  try {
    const certificates = await findUserCertificates(req.user.id);
    return res.status(200).json({ success: true, certificates });
  } catch {
    return respondInternalError(res);
  }
};

export const createMyCertificate = async (req, res) => {
  const validation = validateCertificateData(req.body, { requireFields: true });
  if (validation.error) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  try {
    const certificate = await createUserCertificate(req.user.id, validation.data);
    return res.status(201).json({ success: true, message: "Certificate created successfully", certificate });
  } catch {
    return respondInternalError(res);
  }
};

export const updateMyCertificate = async (req, res) => {
  const certificateId = getCertificateId(req.params.certificateId);
  if (!certificateId) {
    return res.status(400).json({ success: false, message: "Provide a valid certificate ID" });
  }

  try {
    const existingCertificate = await findUserCertificate(req.user.id, certificateId);
    if (!existingCertificate) {
      return res.status(404).json({ success: false, message: "Certificate was not found" });
    }

    const validation = validateCertificateData(req.body, { requireFields: false, existingCertificate });
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const certificate = await updateUserCertificate(req.user.id, certificateId, validation.data);
    return res.status(200).json({ success: true, message: "Certificate updated successfully", certificate });
  } catch {
    return respondInternalError(res);
  }
};

export const deleteMyCertificate = async (req, res) => {
  const certificateId = getCertificateId(req.params.certificateId);
  if (!certificateId) {
    return res.status(400).json({ success: false, message: "Provide a valid certificate ID" });
  }

  try {
    const result = await deleteUserCertificate(req.user.id, certificateId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Certificate was not found" });
    }
    return res.status(200).json({ success: true, message: "Certificate deleted successfully" });
  } catch {
    return respondInternalError(res);
  }
};
