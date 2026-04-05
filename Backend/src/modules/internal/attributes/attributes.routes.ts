import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { attributesController } from "./attributes.controller";
import { parseCreateAttribute, parsePatchAttribute } from "./attributes.validation";

const router = Router();

router.get("/", asyncHandler(attributesController.list.bind(attributesController)));
router.post("/", validateBody(parseCreateAttribute), asyncHandler(attributesController.create.bind(attributesController)));
router.get("/:attributeId", asyncHandler(attributesController.get.bind(attributesController)));
router.patch("/:attributeId", validateBody(parsePatchAttribute), asyncHandler(attributesController.update.bind(attributesController)));
router.delete("/:attributeId", asyncHandler(attributesController.remove.bind(attributesController)));

export default router;
