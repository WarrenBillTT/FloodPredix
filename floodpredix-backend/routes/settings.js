import express from 'express';
import UserSettings from '../models/UserSettings.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user settings
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user._id });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await UserSettings.create({ userId: req.user._id });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

// Update user settings
router.put('/', authenticate, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = await UserSettings.create({ userId: req.user._id });
    }

    // Update settings
    if (req.body.notifications) {
      settings.notifications = { ...settings.notifications, ...req.body.notifications };
    }
    if (req.body.preferences) {
      settings.preferences = { ...settings.preferences, ...req.body.preferences };
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Delete user account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    // Delete settings
    await UserSettings.findOneAndDelete({ userId: req.user._id });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

export default router;

