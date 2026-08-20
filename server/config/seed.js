/**
 * Creates or updates the initial admin account from the environment.
 * Run manually, once per environment:  npm run seed
 *
 * The first admin is never created through POST /api/auth/register — that
 * endpoint whitelists `organization` and `individual` only (AGENTS.md §5,
 * SRS §2.6, FR-5.4).
 */
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const connectToDatabase = require("./mongoose.config");
const User = require("../models/user.model");

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    console.error("[seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env");
    process.exitCode = 1;
    return;
  }

  await connectToDatabase();

  let admin = await User.findOne({ email }).select("+password");

  if (admin) {
    admin.name = admin.name || "مدير النظام";
    admin.role = "admin";
    admin.status = "approved";
    // Re-applies the password from .env; the pre-save hook hashes it.
    admin.password = password;
    await admin.save();
    console.log(`[seed] admin updated: ${admin.email}`);
  } else {
    admin = await User.create({
      name: "مدير النظام",
      email,
      password,
      role: "admin",
      status: "approved",
    });
    console.log(`[seed] admin created: ${admin.email}`);
  }
};

seedAdmin()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
