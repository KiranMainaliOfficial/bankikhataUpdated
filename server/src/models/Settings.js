import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: 'BankiKhata' },
    logoUrl: String,
    currency: { type: String, default: 'NPR' },
    language: { type: String, enum: ['en', 'ne'], default: 'en' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    reminderDays: { type: Number, default: 30 },
    highOutstandingLimit: { type: Number, default: 10000 },
    googleSheets: {
      enabled: { type: Boolean, default: false },
      spreadsheetId: String,
      lastSyncAt: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
