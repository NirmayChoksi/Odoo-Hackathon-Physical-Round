import { Router } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { requireInternalStaffSync } from "../../../middlewares/role.middleware";
import { parseCreateCustomer, parsePatchCustomer } from "./customer.validation";
import { parseCreateContact } from "../contacts/contact.validation";
import { customerController } from "./customer.controller";

const router = Router();

router.use(requireInternalStaffSync);

router.get("/", asyncHandler(customerController.list.bind(customerController)));
router.post("/", validateBody(parseCreateCustomer), asyncHandler(customerController.create.bind(customerController)));

router.get(
  "/:customerId/contacts",
  asyncHandler(customerController.listContacts.bind(customerController))
);
router.post(
  "/:customerId/contacts",
  validateBody(parseCreateContact),
  asyncHandler(customerController.addContact.bind(customerController))
);

router.get("/:customerId", asyncHandler(customerController.get.bind(customerController)));
router.patch(
  "/:customerId",
  validateBody(parsePatchCustomer),
  asyncHandler(customerController.update.bind(customerController))
);
router.delete("/:customerId", asyncHandler(customerController.remove.bind(customerController)));

export default router;
