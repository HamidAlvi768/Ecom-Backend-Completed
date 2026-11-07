import bcrypt from "bcrypt";
import User from "../models/Users.mjs";
import { signToken } from "../middleware/auth.mjs";

const publicUser = (user) => {
  const { password, ...rest } = user.toObject();
  return rest;
};

// POST /api/signup  { name, email, password }  ->  { result: user, auth: token }
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.json({ result: publicUser(user), auth: signToken(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/login  { email, password }  ->  { user, auth: token }
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ result: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ result: "No User Found" });
    }
    res.json({ user: publicUser(user), auth: signToken(user) });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};

// GET /api/users
export const getUsers = async (req, res) => {
  try {
    res.json(await User.find().select("-password"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
