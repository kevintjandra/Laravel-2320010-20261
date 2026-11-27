import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();

app.use(cors());
app.use(express.json());

const databaseUrl = process.env.DATABASE_URL;
let db;

if (databaseUrl) {
  const url = new URL(databaseUrl);

  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

  if (!url.hostname || !url.username || !database) {
    throw new Error("DATABASE_URL must include a host, username, and database name");
  }

  db = mysql.createPool({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
  });
}

app.get("/", (req, res) => {
  res.json({
    message: "Backend API is running",
  });
});

app.get("/api/health", async (req, res) => {
  if (!db) {
    return res.status(503).json({
      status: "error",
      message: "MySQL is not configured. Set DATABASE_URL.",
    });
  }

  try {
    await db.query("SELECT 1");
    return res.json({
      status: "ok",
      message: "API is healthy",
      database: "connected",
    });
  } catch (error) {
    console.error("MySQL health check failed:", error.code || error.message);
    return res.status(503).json({
      status: "error",
      message: "MySQL connection failed",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
