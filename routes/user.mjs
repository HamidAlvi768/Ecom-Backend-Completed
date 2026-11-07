import express from "express";
import { signup, login, getUsers } from "../Controllers/User.mjs";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/", getUsers);

export default router;
