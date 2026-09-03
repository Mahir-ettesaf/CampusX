import { v2 as cloudinary } from "cloudinary";
import mammoth from "mammoth";
import multer from "multer";
import { PDFParse } from "pdf-parse";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 50000;
const ALLOWED_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
]);

export class ResumeDocumentError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const extensionFor = (name = "") => name.toLowerCase().split(".").pop();
const typeFor = (file) => ALLOWED_TYPES.get(file?.mimetype);
const hasPdfSignature = (buffer) => buffer.subarray(0, 5).toString("ascii") === "%PDF-";
const hasDocxSignature = (buffer) => buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    const type = ALLOWED_TYPES.get(file.mimetype);
    if (!type || extensionFor(file.originalname) !== type) {
      return callback(new ResumeDocumentError(400, "Upload a PDF or DOCX resume file."));
    }
    callback(null, true);
  },
});

export const resumeDocumentUpload = (req, res, next) => multerUpload.single("file")(req, res, (error) => {
  if (!error) return next();
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "Resume files must be 5 MB or smaller." });
  }
  return res.status(error.status || 400).json({ success: false, message: error.message || "Unable to upload the resume file." });
});

export const validateResumeDocument = (file) => {
  const type = typeFor(file);
  if (!file || !type) throw new ResumeDocumentError(400, "Upload a PDF or DOCX resume file.");
  if (!file.buffer?.length) throw new ResumeDocumentError(400, "The uploaded resume file is empty.");
  if (file.size > MAX_FILE_SIZE_BYTES) throw new ResumeDocumentError(400, "Resume files must be 5 MB or smaller.");
  if (type === "pdf" && !hasPdfSignature(file.buffer)) throw new ResumeDocumentError(400, "The uploaded file is not a valid PDF.");
  if (type === "docx" && !hasDocxSignature(file.buffer)) throw new ResumeDocumentError(400, "The uploaded file is not a valid DOCX document.");
  return type;
};

export const extractResumeText = async (file) => {
  const type = validateResumeDocument(file);
  try {
    let text;
    if (type === "pdf") {
      const parser = new PDFParse({ data: file.buffer });
      try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
    } else {
      text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
    }
    const normalized = text?.replace(/\u0000/g, "").trim().slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    if (!normalized) throw new ResumeDocumentError(400, "No readable text was found in the uploaded resume.");
    return { text: normalized, type };
  } catch (error) {
    if (error instanceof ResumeDocumentError) throw error;
    throw new ResumeDocumentError(400, "Unable to extract readable text from this resume file.");
  }
};

const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new ResumeDocumentError(503, "Resume upload storage is not configured yet.");
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
};

export const storeResumeDocument = (buffer, userId, resumeId, type) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: "raw",
      folder: `campusx/resumes/user-${userId}`,
      public_id: `resume-${resumeId}-${Date.now()}`,
      format: type,
      overwrite: false,
    }, (error, result) => error ? reject(new ResumeDocumentError(502, "Unable to store the resume file. Please try again.")) : resolve({ fileUrl: result.secure_url, publicId: result.public_id }));
    stream.end(buffer);
  });
};

export const removeStoredResumeDocument = async (publicId) => {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }); } catch { /* Best-effort cleanup only. */ }
};
