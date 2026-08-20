const mongoose = require("mongoose");

/**
 * Opens the single shared Mongoose connection (NFR-PO1: local or Atlas,
 * distinguished only by MONGOOSE_URI). Logs the *full* error object on
 * failure — a fixed "connection failed" string hides the actual cause.
 */
const connectToDatabase = async () => {
  const uri = process.env.MONGOOSE_URI;

  if (!uri) {
    const err = new Error(
      "MONGOOSE_URI is missing. Copy server/.env.example to server/.env and fill it in."
    );
    console.error("[db] configuration error:", err);
    throw err;
  }

  try {
    await mongoose.connect(uri);
    console.log(`[db] database connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("[db] database connection failed:", err);
    throw err;
  }
};

module.exports = connectToDatabase;
