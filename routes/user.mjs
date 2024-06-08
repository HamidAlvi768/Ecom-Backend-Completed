import express from "express";
import { signup, login } from "../Controllers/User.mjs";

const router = express.Router();

router.route("/signup").post(signup);

router.route("/login").post(login);


export default router;
