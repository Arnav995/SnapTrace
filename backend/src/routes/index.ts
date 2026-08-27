import { Router } from "express";
import eventRoutes from "./event.routes.js"
import uploadRoutes from "./upload.routes.js"

const router = Router();

router.use("/events", eventRoutes);
     
router.use("/", uploadRoutes);

export default router;