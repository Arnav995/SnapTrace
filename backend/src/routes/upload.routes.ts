import { Router } from "express";
import { confirmUploads, generateBatchPresignedUrls } from "../controllers/upload.controller";

const router = Router();

router.post("/events/:eventId/upload-url/batch", generateBatchPresignedUrls);
router.post("/events/:eventId/upload-confirm", confirmUploads);

export default router;