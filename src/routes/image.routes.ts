import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import {
  generateImage,
  saveImage,
  uploadCustomDesign,
} from "@/controllers/image.controller";

const router = Router();

router.post("/generate", authenticate, generateImage);
router.post("/save", authenticate, saveImage);
router.post("/upload-custom", authenticate, uploadCustomDesign);

export default router;
