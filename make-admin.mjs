// make-admin.mjs - gives an existing account access to the admin dashboard.
// Usage:  npm run make-admin -- someone@example.com
//         npm run make-admin -- someone@example.com --remove   (back to customer)
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/Users.mjs";

dotenv.config();

const email = String(process.argv[2] || "").toLowerCase().trim();
const role = process.argv.includes("--remove") ? "customer" : "admin";

if (!email) {
  console.error("Usage: npm run make-admin -- <email> [--remove]");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ecommerce");
const user = await User.findOneAndUpdate({ email }, { role }, { new: true });
if (!user) {
  console.error(`No account with email ${email}. Sign up in the store first.`);
  process.exitCode = 1;
} else {
  console.log(`${user.email} is now: ${user.role}`);
}
await mongoose.disconnect();
