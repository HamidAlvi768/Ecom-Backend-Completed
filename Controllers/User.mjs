import User from "../models/Users.mjs";

// Signup controller
export const signup = async (req, res) => {
  try {
    let user = new User(req.body);
  let result = await user.save();
  res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if password is correct
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
