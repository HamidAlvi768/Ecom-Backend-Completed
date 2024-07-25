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
    if (req.body.password && req.body.email) {
      let user = await User.findOne(req.body).select("-password");
      if (user) {
        res.send(user);
      } else {
        res.send({ result: "No User Found" });
      }
    }
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};
