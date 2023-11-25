// routes/user.js
import express from 'express';
const router = express.Router();
import User from '../models/Users.mjs';

// Define user authentication routes here


// User registration route
router.post('/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      // Check if the email is already registered
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email is already registered' });
      }
  
      // Create a new user
      const newUser = new User({ name, email, password });
  
      // Save the user to the database
      await newUser.save();
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


// User login route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });

        }
        return res.json({ message: 'Authentication successful', user: user });
      });
    })(req, res, next);
  });
  
  // User logout route
  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logout successful' });
  });

export default router;
