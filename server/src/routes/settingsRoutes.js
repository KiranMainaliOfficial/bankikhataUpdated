import express from 'express';
import { z } from 'zod';
import Settings from '../models/Settings.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);

const settingsSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    currency: z.string().default('NPR').optional(),
    language: z.enum(['en', 'ne']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    reminderDays: z.coerce.number().min(1).optional(),
    highOutstandingLimit: z.coerce.number().min(0).optional(),
    googleSheets: z
      .object({
        enabled: z.boolean().optional(),
        spreadsheetId: z.string().optional()
      })
      .optional()
  })
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ businessName: process.env.BUSINESS_NAME || 'BankiKhata' });
    res.json({ settings });
  })
);

router.put(
  '/',
  authorize('admin'),
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const settings = await Settings.findOneAndUpdate({}, req.validated.body, {
      new: true,
      upsert: true,
      runValidators: true
    });
    res.json({ settings });
  })
);

export default router;
