import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserSettings from "../models/UserSettings.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Google OAuth Login
router.post("/google", async (req, res) => {
  try {
    const { credential, email, name, picture } = req.body;

    // In production, you should verify the credential with Google's API
    // For now, we'll accept the credential and use provided user data
    // The frontend sends the credential from Google OAuth response

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    // Try to find user by email or create new one
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        name: name || "User",
        email: email || "",
        avatar: picture || null,
        googleId: credential,
        lastLogin: new Date(),
      });

      // Create default settings
      await UserSettings.create({
        userId: user._id,
      });
    } else {
      // Update last login and avatar if provided
      user.lastLogin = new Date();
      if (picture) user.avatar = picture;
      if (!user.googleId) user.googleId = credential;
      await user.save();
    }

    const token = generateToken(user._id);
    const settings = await UserSettings.findOne({ userId: user._id });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        settings: settings || {},
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// Regular email/password login (optional)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    const settings = await UserSettings.findOne({ userId: user._id });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        settings: settings || {},
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// Get current user
router.get("/me", authenticate, async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id.toString(),
          name: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          role: req.user.role,
        },
        settings: settings || {},
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post("/logout", authenticate, async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
