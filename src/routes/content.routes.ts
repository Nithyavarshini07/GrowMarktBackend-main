import { Router } from "express";
import multer from "multer";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import {
  generateContent,
  generateWeeklyContent,
  generateIdeaPost,
  generateSuggestedContent,
} from "@/controllers/content.controller";
import {
  publishProject,
  saveProjectDraft,
  uploadProjectImage,
} from "@/controllers/ai-content.controller";

const router = Router();
const canEdit = [authenticate, requireRole("owner", "editor")];
const canPublish = [authenticate, requireRole("owner")];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

function normalizeMultipartFile(req: any, _res: any, next: any): void {
  if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
    req.file = req.files[0];
  }
  next();
}

router.post("/generate", ...canEdit, generateContent);
router.post("/generate-weekly", ...canEdit, generateWeeklyContent);
router.post("/generate-idea", ...canEdit, generateIdeaPost);
router.post("/generate-suggestions", ...canEdit, generateSuggestedContent);
router.post(
  "/upload-image",
  ...canEdit,
  upload.any(),
  normalizeMultipartFile,
  uploadProjectImage,
);
router.post("/save-draft", ...canEdit, saveProjectDraft);
router.post("/publish", ...canPublish, publishProject);

export default router;
