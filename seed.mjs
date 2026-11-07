// seed.mjs - fills the local database with sample products and a demo account.
// Run with:  npm run seed      (safe to run again: it replaces the sample data)
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Product from "./models/Products.mjs";
import User from "./models/Users.mjs";

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}/uploads`;
const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Demo login for local testing only
export const DEMO_USER = { name: "Demo User", email: "demo@example.com", password: "demo1234" };

const products = [
  { name: "Mountain Sunrise Poster", category: "Posters", company: "Earth Prints", price: 24, color: ["#f97316", "#7c2d12"] },
  { name: "Ocean Waves Poster", category: "Posters", company: "Earth Prints", price: 29, color: ["#0ea5e9", "#0c4a6e"] },
  { name: "Forest Trail Poster", category: "Posters", company: "Wild Paper Co", price: 32, color: ["#22c55e", "#14532d"] },
  { name: "Desert Dunes Poster", category: "Posters", company: "Wild Paper Co", price: 27, color: ["#eab308", "#713f12"] },
  { name: "City Lights Postcard Set", category: "Postcards", company: "Postal Studio", price: 12, color: ["#a855f7", "#3b0764"] },
  { name: "Botanical Postcard Set", category: "Postcards", company: "Postal Studio", price: 14, color: ["#84cc16", "#365314"] },
  { name: "Vintage Travel Postcards", category: "Postcards", company: "Earth Prints", price: 16, color: ["#f43f5e", "#4c0519"] },
  { name: "Framed Aurora Print", category: "Framed Art", company: "Northlight", price: 89, color: ["#14b8a6", "#134e4a"] },
  { name: "Framed Night Sky Print", category: "Framed Art", company: "Northlight", price: 120, color: ["#6366f1", "#1e1b4b"] },
  { name: "Large Canvas Landscape", category: "Framed Art", company: "Wild Paper Co", price: 249, color: ["#64748b", "#0f172a"] },
  { name: "Nature Sticker Pack", category: "Stickers", company: "Postal Studio", price: 10, color: ["#ec4899", "#500724"] },
  { name: "Planet Earth Notebook", category: "Stationery", company: "Earth Prints", price: 18, color: ["#06b6d4", "#164e63"] },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const svg = (name, category, [c1, c2]) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="560" cy="250" r="110" fill="#ffffff" opacity="0.25"/>
  <path d="M0 620 L220 400 L380 540 L520 380 L800 640 L800 800 L0 800 Z" fill="#000000" opacity="0.25"/>
  <text x="60" y="110" font-family="Arial, sans-serif" font-size="30" fill="#ffffff" opacity="0.85" letter-spacing="4">${category.toUpperCase()}</text>
  <text x="60" y="730" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">${name}</text>
</svg>`;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ecommerce");

  const docs = products.map(({ color, ...p }) => {
    const file = `seed-${slug(p.name)}.svg`;
    fs.writeFileSync(path.join(uploadDir, file), svg(p.name, p.category, color));
    return {
      ...p,
      image: `${BASE}/${file}`,
      description: `<p>${p.name} from ${p.company}. Printed on sustainably sourced paper with fade-resistant inks.</p>`,
    };
  });

  await Product.deleteMany({ image: { $regex: "/uploads/seed-" } });
  await Product.insertMany(docs);

  await User.deleteOne({ email: DEMO_USER.email });
  await User.create({ ...DEMO_USER, password: await bcrypt.hash(DEMO_USER.password, 10) });

  console.log(`Seeded ${docs.length} products and demo user ${DEMO_USER.email}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
