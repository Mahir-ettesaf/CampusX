import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createMyCertificate,
  deleteMyCertificate,
  getMyCertificates,
  updateMyCertificate,
  uploadMyCertificateFile,
} from "../controllers/certificate.controllers.js";
import { portfolioFileUpload } from "../services/portfolio-upload.service.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getMyCertificates);
router.post("/", createMyCertificate);
router.post("/:certificateId/upload", portfolioFileUpload, uploadMyCertificateFile);
router.put("/:certificateId", updateMyCertificate);
router.delete("/:certificateId", deleteMyCertificate);

export default router;
