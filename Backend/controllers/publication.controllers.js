import { createUserPublication, deleteUserPublication, findUserPublication, findUserPublications, updateUserPublication } from "../models/publication.model.js";
import { PortfolioUploadError, storePortfolioFile } from "../services/portfolio-upload.service.js";

const FIELDS = new Set(["title", "authors", "journal_or_conference", "publication_date", "doi", "publication_url", "abstract"]);
const IDENTITY_FIELDS = new Set(["user_id", "owner_id", "email", "role"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const limits = { title: 300, authors: 1000, journal_or_conference: 300, doi: 255, publication_url: 2048, abstract: 5000 };
const names = { title: "Publication title", authors: "Authors", journal_or_conference: "Journal or conference", doi: "DOI", publication_url: "Publication URL", abstract: "Abstract" };

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const getId = (value) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; };
const validDate = (value) => { if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false; const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; };
const validUrl = (value) => { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } };
const isGraduate = (req) => req.user.role === "graduate";
const rejectNonGraduate = (res) => res.status(403).json({ success: false, message: "Publications are available to Graduate users only" });

const validate = (body, requireFields) => {
  if (!isPlainObject(body)) return { error: "Publication data must be an object" };
  const keys = Object.keys(body);
  if (keys.some((key) => IDENTITY_FIELDS.has(key))) return { error: "User identity fields cannot be provided for a publication" };
  if (keys.some((key) => !FIELDS.has(key))) return { error: "The request contains an unsupported publication field" };
  if (!requireFields && keys.length === 0) return { error: "Provide at least one publication field to update" };
  const data = {};
  for (const field of ["title", "authors", "journal_or_conference"]) {
    if (requireFields || Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string" || !body[field].trim()) return { error: `${names[field]} is required` };
      if (body[field].trim().length > limits[field]) return { error: `${names[field]} must be ${limits[field]} characters or fewer` };
      data[field] = body[field].trim();
    }
  }
  if (requireFields || Object.hasOwn(body, "publication_date")) {
    if (!validDate(body.publication_date)) return { error: "Publication date must be a valid date in YYYY-MM-DD format" };
    data.publication_date = body.publication_date;
  }
  for (const field of ["doi", "abstract"]) {
    if (Object.hasOwn(body, field)) {
      if (body[field] !== null && typeof body[field] !== "string") return { error: `${names[field]} must be text` };
      if (typeof body[field] === "string" && body[field].trim().length > limits[field]) return { error: `${names[field]} must be ${limits[field]} characters or fewer` };
      data[field] = typeof body[field] === "string" ? body[field].trim() || null : null;
    } else if (requireFields) data[field] = null;
  }
  if (Object.hasOwn(body, "publication_url")) {
    if (body.publication_url === null) data.publication_url = null;
    else if (typeof body.publication_url !== "string" || body.publication_url.trim().length > limits.publication_url || !validUrl(body.publication_url.trim())) return { error: "Publication URL must be a valid http or https URL" };
    else data.publication_url = body.publication_url.trim();
  } else if (requireFields) data.publication_url = null;
  return { data };
};
const internalError = (res) => res.status(500).json({ success: false, message: "Unable to process the publication request" });

export const getMyPublications = async (req, res) => { if (!isGraduate(req)) return rejectNonGraduate(res); try { return res.status(200).json({ success: true, publications: await findUserPublications(req.user.id) }); } catch { return internalError(res); } };
export const createMyPublication = async (req, res) => { if (!isGraduate(req)) return rejectNonGraduate(res); const validation = validate(req.body, true); if (validation.error) return res.status(400).json({ success: false, message: validation.error }); try { return res.status(201).json({ success: true, message: "Publication created successfully", publication: await createUserPublication(req.user.id, validation.data) }); } catch { return internalError(res); } };
export const updateMyPublication = async (req, res) => { if (!isGraduate(req)) return rejectNonGraduate(res); const id = getId(req.params.publicationId); if (!id) return res.status(400).json({ success: false, message: "Provide a valid publication ID" }); try { if (!await findUserPublication(req.user.id, id)) return res.status(404).json({ success: false, message: "Publication was not found" }); const validation = validate(req.body, false); if (validation.error) return res.status(400).json({ success: false, message: validation.error }); return res.status(200).json({ success: true, message: "Publication updated successfully", publication: await updateUserPublication(req.user.id, id, validation.data) }); } catch { return internalError(res); } };
export const deleteMyPublication = async (req, res) => { if (!isGraduate(req)) return rejectNonGraduate(res); const id = getId(req.params.publicationId); if (!id) return res.status(400).json({ success: false, message: "Provide a valid publication ID" }); try { const result = await deleteUserPublication(req.user.id, id); if (!result.affectedRows) return res.status(404).json({ success: false, message: "Publication was not found" }); return res.status(200).json({ success: true, message: "Publication deleted successfully" }); } catch { return internalError(res); } };
export const uploadMyPublicationFile = async (req, res) => { if (!isGraduate(req)) return rejectNonGraduate(res); const id = getId(req.params.publicationId); if (!id) return res.status(400).json({ success: false, message: "Provide a valid publication ID" }); try { if (!await findUserPublication(req.user.id, id)) return res.status(404).json({ success: false, message: "Publication was not found" }); const publication_url = await storePortfolioFile(req.file, `publications/user-${req.user.id}`, id); const publication = await updateUserPublication(req.user.id, id, { publication_url }); return res.json({ success: true, message: "Publication file uploaded successfully", publication }); } catch (error) { return res.status(error instanceof PortfolioUploadError ? error.status : 500).json({ success: false, message: error instanceof PortfolioUploadError ? error.message : "Unable to upload the publication file" }); } };
