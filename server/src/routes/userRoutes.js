import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect, authorize('admin'));

const userSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8).optional(),
    role: z.enum(['admin', 'staff']).default('staff'),
    phone: z.string().optional(),
    isActive: z.boolean().optional()
  })
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  })
);

router.post(
  '/',
  validate(userSchema.extend({ body: userSchema.shape.body.extend({ password: z.string().min(8) }) })),
  asyncHandler(async (req, res) => {
    const user = await User.create(req.validated.body);
    res.status(201).json({ user });
  })
);

router.put(
  '/:id',
  validate(userSchema.extend({ params: z.object({ id: z.string() }) })),
  asyncHandler(async (req, res) => {
    const updates = { ...req.validated.body };
    if (!updates.password) delete updates.password;
    const user = await User.findById(req.validated.params.id).select('+password');
    Object.assign(user, updates);
    await user.save();
    user.password = undefined;
    res.json({ user });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  })
);

export default router;
