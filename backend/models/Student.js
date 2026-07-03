import mongoose from 'mongoose'

const dayRecordSchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  opened: { type: Boolean, default: false },
  openedAt: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  // Optional metrics for leaderboard scoring (if collected via Apps Script webhook
  // from the Google Form, or self-reported). See README for wiring instructions.
  accuracy: { type: Number }, // 0-100
  timeTakenSeconds: { type: Number },
}, { _id: false })

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true, index: true },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
  },
  registrationDate: { type: Date, default: Date.now },
  days: { type: [dayRecordSchema], default: [] },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastStreakCheckDate: { type: Date }, // used by the daily cron to detect missed days
}, { timestamps: true })

studentSchema.index({ mobile: 1 }, { unique: true })

export default mongoose.model('Student', studentSchema)