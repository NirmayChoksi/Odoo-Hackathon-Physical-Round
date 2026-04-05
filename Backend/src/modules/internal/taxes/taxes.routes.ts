import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { taxesController } from "./taxes.controller";

const router = Router();

router.get("/", asyncHandler(taxesController.list.bind(taxesController)));
router.post("/", asyncHandler(taxesController.create.bind(taxesController)));
router.get("/:taxId", asyncHandler(taxesController.get.bind(taxesController)));
router.patch("/:taxId", asyncHandler(taxesController.update.bind(taxesController)));
router.delete("/:taxId", asyncHandler(taxesController.remove.bind(taxesController)));

export default router;
