import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createMyCertificate,
  deleteMyCertificate,
  getMyCertificates,
  updateMyCertificate,
} from "../controllers/certificate.controllers.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getMyCertificates);
router.post("/", createMyCertificate);
router.put("/:certificateId", updateMyCertificate);
router.delete("/:certificateId", deleteMyCertificate);

export default router;
