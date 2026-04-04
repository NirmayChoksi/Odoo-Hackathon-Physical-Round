import dotenv from "dotenv";

dotenv.config();

import { pool } from "./config/db";
import { ensureDbPatches } from "./db/ensurePatches";

ensureDbPatches()
  .then(() => {
    console.log("DB patches applied.");
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    pool.end().finally(() => process.exit(1));
  });
