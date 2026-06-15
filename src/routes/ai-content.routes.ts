import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import {
  analyzeProjectIdea,
  batchCreateProjects,
  createIdeaProject,
  duplicateProject,
  editProjectImageWithAI,
  generateCaptionFromImage,
  generateProjectCaption,
  generateProjectImage,
  getProjectById,
  listProjects,
  retryProjectStep,
  saveProjectDraft,
  selectProjectCaption,
  selectProjectImage,
} from "@/controllers/ai-content.controller";

const router = Router();

const canEdit = [authenticate, requireRole("owner", "editor")];

// AI Pipeline steps — IDEA → ANALYZED → IMAGE_GENERATED → EDITED → CAPTION_GENERATED → READY → PUBLISHED
router.post("/idea", ...canEdit, createIdeaProject);
router.post("/analyze", ...canEdit, analyzeProjectIdea);
router.post("/generate-image", ...canEdit, generateProjectImage);
router.post("/select-image", ...canEdit, selectProjectImage);
router.post("/edit-image", ...canEdit, editProjectImageWithAI);
router.post("/generate-caption", ...canEdit, generateProjectCaption);
router.post("/select-caption", ...canEdit, selectProjectCaption);  // NEW — transitions to READY
router.post("/caption-from-image", ...canEdit, generateCaptionFromImage);

// Draft + retry
router.post("/save-draft", ...canEdit, saveProjectDraft);
router.post("/:id/retry", ...canEdit, retryProjectStep);

// Batch + duplicate
router.post("/batch", ...canEdit, batchCreateProjects);
router.post("/projects/:id/duplicate", ...canEdit, duplicateProject);

// Project read
router.get("/projects", ...canEdit, listProjects);
router.get("/projects/:id", ...canEdit, getProjectById);

export default router;
