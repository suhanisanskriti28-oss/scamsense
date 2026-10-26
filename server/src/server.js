import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";

import app from "./app.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Configure it in server/.env before starting the API.");
}

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`[ScamSense API] Server running on http://localhost:${PORT}`);
});
