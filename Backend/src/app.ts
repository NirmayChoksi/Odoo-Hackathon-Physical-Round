import cors from 'cors';
import express from 'express';
import { errorMiddleware } from './middlewares/error.middleware';
import cartRoutes from './modules/cart/cart.routes';
import shopRoutes from './modules/external/shop/shop.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/shop', shopRoutes);
app.use('/api/cart', cartRoutes);

app.use(errorMiddleware);

export default app;
