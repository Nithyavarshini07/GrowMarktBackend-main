import { Router } from "express";
import { authenticate, requireRole } from "@/middleware/auth.middleware";
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
} from "@/controllers/bookmarks.controller";

const router = Router();
const canEdit = [authenticate, requireRole("owner", "editor")];

router.post("/", ...canEdit, createBookmark);
router.delete("/:id", ...canEdit, deleteBookmark);
router.get("/", ...canEdit, listBookmarks);

export default router;
