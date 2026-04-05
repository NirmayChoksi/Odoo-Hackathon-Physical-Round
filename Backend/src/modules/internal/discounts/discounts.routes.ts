import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { discountsController } from "./discounts.controller";
import { parseCreateDiscount, parseDiscountListQuery, parsePatchDiscount } from "./discounts.validation";

const router = Router();

router.get("/", asyncHandler(discountsController.list.bind(discountsController)));
router.post("/", validateBody(parseCreateDiscount), asyncHandler(discountsController.create.bind(discountsController)));
router.get("/:discountId", asyncHandler(discountsController.get.bind(discountsController)));
router.patch("/:discountId", validateBody(parsePatchDiscount), asyncHandler(discountsController.update.bind(discountsController)));
router.delete("/:discountId", asyncHandler(discountsController.remove.bind(discountsController)));

export default router;
