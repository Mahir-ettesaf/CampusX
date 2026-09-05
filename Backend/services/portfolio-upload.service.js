import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TYPES = new Map([["application/pdf", "pdf"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"], ["image/jpeg", "jpg"], ["image/png", "png"]]);
export class PortfolioUploadError extends Error { constructor(status, message) { super(message); this.status = status; } }
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE, files: 1 }, fileFilter: (req, file, done) => TYPES.has(file.mimetype) ? done(null, true) : done(new PortfolioUploadError(400, "Upload a PDF, DOCX, JPG, or PNG file.")) });
export const portfolioFileUpload = (req, res, next) => upload.single("file")(req, res, (error) => { if (!error) return next(); if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, message: "Files must be 10 MB or smaller." }); return res.status(error.status || 400).json({ success: false, message: error.message || "Unable to upload the file." }); });
export const storePortfolioFile = (file, folder, itemId) => {
  if (!file?.buffer?.length || !TYPES.has(file.mimetype)) throw new PortfolioUploadError(400, "Upload a PDF, DOCX, JPG, or PNG file.");
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new PortfolioUploadError(503, "File upload storage is not configured yet.");
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  return new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ resource_type: file.mimetype.startsWith("image/") ? "image" : "raw", folder: `campusx/${folder}`, public_id: `${folder}-${itemId}-${Date.now()}`, overwrite: false }, (error, result) => error ? reject(new PortfolioUploadError(502, "Unable to store the file. Please try again.")) : resolve(result.secure_url)); stream.end(file.buffer); });
};
