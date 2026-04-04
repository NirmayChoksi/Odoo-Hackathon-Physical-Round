import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import cartRoutes from "./modules/external/cart/cart.routes";
import checkoutRoutes from "./modules/external/checkout/checkout.routes";
import invoiceRoutes from "./modules/external/invoices/invoice.routes";
import orderRoutes from "./modules/external/orders/order.routes";
import profileRoutes from "./modules/external/profile/profile.routes";
import shopRoutes from "./modules/external/shop/shop.routes";

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

app.use(errorMiddleware);

export default app;
