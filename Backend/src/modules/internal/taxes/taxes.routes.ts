import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { taxesController } from "./taxes.controller";
import { parseCreateTax, parsePatchTax } from "./taxes.validation";

const router = Router();

router.get("/", asyncHandler(taxesController.list.bind(taxesController)));
router.post("/", validateBody(parseCreateTax), asyncHandler(taxesController.create.bind(taxesController)));
router.get("/:taxId", asyncHandler(taxesController.get.bind(taxesController)));
router.patch(
  "/:taxId",
  validateBody(parsePatchTax),
  asyncHandler(taxesController.update.bind(taxesController)),
);
router.delete("/:taxId", asyncHandler(taxesController.remove.bind(taxesController)));

export default router;
