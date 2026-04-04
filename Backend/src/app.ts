import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import cartRoutes from "./modules/external/cart/cart.routes";
import checkoutRoutes from "./modules/external/checkout/checkout.routes";
import invoiceRoutes from "./modules/external/invoices/invoice.routes";
import orderRoutes from "./modules/external/orders/order.routes";
import profileRoutes from "./modules/external/profile/profile.routes";
import shopRoutes from "./modules/external/shop/shop.routes";
import contactRoutes from "./modules/internal/contacts/contact.routes";
import customerRoutes from "./modules/internal/customers/customer.routes";
import dashboardRoutes from "./modules/internal/dashboard/dashboard.routes";
import internalInvoiceRoutes from "./modules/internal/invoices/internalInvoice.routes";
import internalProfileRoutes from "./modules/internal/profile/internalProfile.routes";
import paymentRoutes from "./modules/internal/payments/payment.routes";
import productManagementRoutes from "./modules/internal/product-management/productManagement.routes";
import variantRoutes from "./modules/internal/product-management/variant.routes";
import quotationTemplateItemRoutes from "./modules/internal/quotation-template-items/quotationTemplateItem.routes";
import quotationTemplateRoutes from "./modules/internal/quotation-templates/quotationTemplate.routes";
import recurringPlanRoutes from "./modules/internal/recurring-plans/recurringPlan.routes";
import reportRoutes from "./modules/internal/reports/report.routes";
import subscriptionItemRoutes from "./modules/internal/subscription-items/subscriptionItem.routes";
import subscriptionRoutes from "./modules/internal/subscriptions/subscription.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/external/shop", shopRoutes);
app.use("/api/external/cart", cartRoutes);
app.use("/api/external/checkout", checkoutRoutes);
app.use("/api/external/orders", orderRoutes);
app.use("/api/external/invoices", invoiceRoutes);
app.use("/api/external/profile", profileRoutes);

app.use("/api/internal/dashboard", dashboardRoutes);
app.use("/api/internal/customers", customerRoutes);
app.use("/api/internal/contacts", contactRoutes);
app.use("/api/internal/products", productManagementRoutes);
app.use("/api/internal/variants", variantRoutes);
app.use("/api/internal/recurring-plans", recurringPlanRoutes);
app.use("/api/internal/quotation-templates", quotationTemplateRoutes);
app.use("/api/internal/quotation-template-items", quotationTemplateItemRoutes);
app.use("/api/internal/subscriptions", subscriptionRoutes);
app.use("/api/internal/subscription-items", subscriptionItemRoutes);
app.use("/api/internal/invoices", internalInvoiceRoutes);
app.use("/api/internal/payments", paymentRoutes);
app.use("/api/internal/reports", reportRoutes);
app.use("/api/internal/profile", internalProfileRoutes);

app.use(errorMiddleware);

export default app;
