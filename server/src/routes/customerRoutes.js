import express from 'express';
import { z } from 'zod';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();
router.use(protect);

const customerBody = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  creditLimit: z.coerce.number().min(0).optional()
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const search = req.query.search?.toString().trim();
    const status = req.query.status?.toString();
    const sort = req.query.sort?.toString() || '-createdAt';

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') filter.status = status;

    const sortMap = {
      name: 'fullName',
      date: '-createdAt',
      amount: '-totals.credit',
      balance: '-totals.balance',
      recent: '-createdAt',
      oldest: 'createdAt'
    };

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort(sortMap[sort] || sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Customer.countDocuments(filter)
    ]);

    res.json({ customers, total, page, pages: Math.ceil(total / limit) });
  })
);

router.post(
  '/',
  validate(z.object({ body: customerBody })),
  asyncHandler(async (req, res) => {
    const customer = await Customer.create({
      ...req.validated.body,
      dueDate: req.validated.body.dueDate ? new Date(req.validated.body.dueDate) : undefined,
      createdBy: req.user._id
    });
    await logActivity(req, 'create', 'customer', customer._id, `Created ${customer.fullName}`);
    req.app.get('io')?.emit('customer:changed', customer);
    res.status(201).json({ customer });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    const transactions = await Transaction.find({ customer: req.params.id })
      .sort({ date: -1, createdAt: -1 })
      .populate('createdBy', 'name');
    res.json({ customer, transactions });
  })
);

router.put(
  '/:id',
  validate(z.object({ body: customerBody.partial(), params: z.object({ id: z.string() }) })),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(
      req.validated.params.id,
      {
        ...req.validated.body,
        dueDate: req.validated.body.dueDate ? new Date(req.validated.body.dueDate) : undefined,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    );
    await logActivity(req, 'update', 'customer', customer._id, `Updated ${customer.fullName}`);
    req.app.get('io')?.emit('customer:changed', customer);
    res.json({ customer });
  })
);

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await Transaction.deleteMany({ customer: req.params.id });
    await Customer.findByIdAndDelete(req.params.id);
    await logActivity(req, 'delete', 'customer', req.params.id, 'Deleted customer and ledger');
    req.app.get('io')?.emit('customer:deleted', req.params.id);
    res.json({ message: 'Customer deleted' });
  })
);

export default router;
