import { Router } from "express";
import { handleCreateEvent, handleGetEvent } from "../controllers/event.controller.js";
import { handleGetUploadUrl } from "../controllers/photo.controller.js";
import { validate } from "../middleware/validate.js";
import { createEventSchema, getEventParamsSchema } from "../schemas/event.schema.js";
import { generateUploadUrlSchema } from "../schemas/photo.schema.js";

const router = Router();

router.post('/', validate(createEventSchema), handleCreateEvent);
router.get("/:id", validate(getEventParamsSchema), handleGetEvent);
router.post("/:id/upload-url", validate(generateUploadUrlSchema), handleGetUploadUrl);

export default router;