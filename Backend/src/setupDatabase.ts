import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "subscription_management_system";

async function setupDatabase(): Promise<void> {
  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });

    console.log("Connected to MySQL.");

    // Create and use DB first since the SQL file assumes it
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    // Read full schema from external .sql file
    const sqlFilePath = path.join(__dirname, '../subscription_management.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log("Executing SQL file content...");
    await connection.query(sqlContent);

    console.log(`Database "${DB_NAME}" and all tables created successfully.`);
  } catch (error) {
    console.error("Error while creating database/tables:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("MySQL connection closed.");
    }
  }
}

setupDatabase();
