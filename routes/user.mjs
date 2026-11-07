import express from "express";
import { getUsers } from "../Controllers/User.mjs";
import { adminOnly } from "../middleware/auth.mjs";

// Mounted at /api/users
const router = express.Router();

router.get("/", adminOnly, getUsers);

export default router;
