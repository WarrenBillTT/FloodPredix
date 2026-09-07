import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    },
    minimumSeverity: {
      type: String,
      enum: ['all', 'warning-critical', 'critical'],
      default: 'warning-critical'
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'en-us',
      enum: ['en-us', 'en-gb', 'es', 'fr']
    },
    theme: {
      type: String,
      default: 'dark',
      enum: ['dark', 'light', 'system']
    },
    timezone: {
      type: String,
      default: 'pacific'
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('UserSettings', userSettingsSchema);

