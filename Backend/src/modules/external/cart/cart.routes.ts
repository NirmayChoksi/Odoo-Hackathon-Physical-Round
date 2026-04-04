import { Router } from "express";
import { requireUser } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/error.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { parseAddCartItem, parseUpdateCartItem } from "./cart.validation";
import { cartController } from "./cart.controller";

const router = Router();

router.use(requireUser);

router.get("/", asyncHandler(cartController.getCart.bind(cartController)));
router.get("/count", asyncHandler(cartController.count.bind(cartController)));
router.post("/", validateBody(parseAddCartItem), asyncHandler(cartController.add.bind(cartController)));
router.put(
  "/:cartItemId",
  validateBody(parseUpdateCartItem),
  asyncHandler(cartController.updateItem.bind(cartController))
);
router.delete("/:cartItemId", asyncHandler(cartController.removeItem.bind(cartController)));

export default router;
