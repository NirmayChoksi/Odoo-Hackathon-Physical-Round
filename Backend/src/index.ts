import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import { ensureDbPatches } from "./db/ensurePatches";

const PORT = Number(process.env.PORT) || 3000;

ensureDbPatches()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database ensure failed (missing base tables or DB down?):", err);
    process.exit(1);
  });
