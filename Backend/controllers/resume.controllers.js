import {
  createUserResume,
  deleteUserResume,
  findUserResumes,
  updateUserResume,
} from "../models/resume.model.js";

const EDITABLE_FIELDS = new Set(["title", "summary", "file_url", "is_primary"]);
const IDENTITY_FIELDS = new Set(["user_id", "owner_id", "email", "role"]);
const MAX_TITLE_LENGTH = 150;
const MAX_SUMMARY_LENGTH = 5000;
const MAX_FILE_URL_LENGTH = 2048;

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const getResumeId = (value) => {
  const resumeId = Number(value);
  return Number.isInteger(resumeId) && resumeId > 0 ? resumeId : null;
};

const validateUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const validateResumeData = (body, { requireTitle }) => {
  if (!isPlainObject(body)) {
    return { error: "Resume data must be an object" };
  }

  const keys = Object.keys(body);
  if (keys.some((key) => IDENTITY_FIELDS.has(key))) {
    return { error: "User identity fields cannot be provided for a resume" };
  }
  if (keys.some((key) => !EDITABLE_FIELDS.has(key))) {
    return { error: "The request contains an unsupported resume field" };
  }
  if (!requireTitle && keys.length === 0) {
    return { error: "Provide at least one resume field to update" };
  }
  if (requireTitle && (!Object.hasOwn(body, "title") || typeof body.title !== "string" || !body.title.trim())) {
    return { error: "Resume title is required" };
  }

  const data = {};
  if (Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { error: "Resume title is required" };
    }
    if (body.title.trim().length > MAX_TITLE_LENGTH) {
      return { error: `Resume title must be ${MAX_TITLE_LENGTH} characters or fewer` };
    }
    data.title = body.title.trim();
  }

  if (Object.hasOwn(body, "summary")) {
    if (body.summary !== null && typeof body.summary !== "string") {
      return { error: "Resume summary must be text" };
    }
    if (typeof body.summary === "string" && body.summary.length > MAX_SUMMARY_LENGTH) {
      return { error: `Resume summary must be ${MAX_SUMMARY_LENGTH} characters or fewer` };
    }
    data.summary = typeof body.summary === "string" ? body.summary.trim() || null : null;
  }

  if (Object.hasOwn(body, "file_url")) {
    if (body.file_url !== null && typeof body.file_url !== "string") {
      return { error: "Resume file URL must be text" };
    }
    if (typeof body.file_url === "string") {
      const fileUrl = body.file_url.trim();
      if (fileUrl.length > MAX_FILE_URL_LENGTH || !validateUrl(fileUrl)) {
        return { error: "Resume file URL must be a valid http or https URL" };
      }
      data.file_url = fileUrl;
    } else {
      data.file_url = null;
    }
  }

  if (Object.hasOwn(body, "is_primary")) {
    if (typeof body.is_primary !== "boolean") {
      return { error: "Primary resume must be true or false" };
    }
    data.is_primary = body.is_primary;
  }

  return { data };
};

const respondInternalError = (res) =>
  res.status(500).json({ success: false, message: "Unable to process the resume request" });

export const getMyResumes = async (req, res) => {
  try {
    const resumes = await findUserResumes(req.user.id);
    return res.status(200).json({ success: true, resumes });
  } catch {
    return respondInternalError(res);
  }
};

export const createMyResume = async (req, res) => {
  const validation = validateResumeData(req.body, { requireTitle: true });
  if (validation.error) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  try {
    const resume = await createUserResume(req.user.id, validation.data);
    return res.status(201).json({ success: true, message: "Resume created successfully", resume });
  } catch {
    return respondInternalError(res);
  }
};

export const updateMyResume = async (req, res) => {
  const resumeId = getResumeId(req.params.resumeId);
  if (!resumeId) {
    return res.status(400).json({ success: false, message: "Provide a valid resume ID" });
  }

  const validation = validateResumeData(req.body, { requireTitle: false });
  if (validation.error) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  try {
    const resume = await updateUserResume(req.user.id, resumeId, validation.data);
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume was not found" });
    }
    return res.status(200).json({ success: true, message: "Resume updated successfully", resume });
  } catch (error) {
    if (error.code === "PRIMARY_RESUME_REQUIRED") {
      return res.status(400).json({ success: false, message: "A user must have a primary resume while resumes exist" });
    }
    return respondInternalError(res);
  }
};

export const deleteMyResume = async (req, res) => {
  const resumeId = getResumeId(req.params.resumeId);
  if (!resumeId) {
    return res.status(400).json({ success: false, message: "Provide a valid resume ID" });
  }

  try {
    const result = await deleteUserResume(req.user.id, resumeId);
    if (!result) {
      return res.status(404).json({ success: false, message: "Resume was not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
      primary_resume_id: result.replacementId,
    });
  } catch {
    return respondInternalError(res);
  }
};
