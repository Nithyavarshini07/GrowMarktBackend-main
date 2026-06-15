import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import {
  schedulePost,
  scheduleBatchPosts,
  listPosts,
  getPostById,
  getPostAnalytics,
  deletePost,
  updatePost,
  publishNow,
} from "@/controllers/scheduler.controller";

const router = Router();
const canEdit = [authenticate, requireRole("owner", "editor")];

// POST /api/v1/posts/publish-now — instant publish without scheduling
router.post("/publish-now", ...canEdit, publishNow);

// POST /api/v1/schedule  — create/update a scheduled post
router.post("/", ...canEdit, schedulePost);

// POST /api/v1/schedule/batch — schedule multiple platform posts together
router.post("/batch", ...canEdit, scheduleBatchPosts);

// GET /api/v1/schedule   — list all posts for authenticated user
router.get("/", ...canEdit, listPosts);

// GET /api/v1/posts/:id/analytics — post-level analytics snapshot
router.get("/:id/analytics", ...canEdit, getPostAnalytics);

// GET /api/v1/schedule/:id  — get a single post by ID
router.get("/:id", ...canEdit, getPostById);

// PUT /api/v1/schedule/:id  — update a post
router.put("/:id", ...canEdit, updatePost);

// DELETE /api/v1/schedule/:id  — remove a post
router.delete("/:id", ...canEdit, deletePost);

export default router;
