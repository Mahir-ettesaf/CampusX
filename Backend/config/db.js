import mysql from "mysql2";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    return;
  }

  console.log("✅ Connected to MySQL Database");
});

export default db;
