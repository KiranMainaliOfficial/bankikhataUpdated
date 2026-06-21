import express from 'express';
import { z } from 'zod';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { recalculateCustomer } from '../utils/ledger.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();
router.use(protect);

const txBody = z.object({
  customer: z.string(),
  type: z.enum(['credit', 'payment']),
  date: z.string().optional(),
  productOrReason: z.string().optional(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(['cash', 'esewa', 'khalti', 'bank_transfer', 'other']).nullable().optional(),
  notes: z.string().optional()
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('customer', 'customerId fullName phone')
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter)
    ]);
    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  })
);

router.post(
  '/',
  validate(z.object({ body: txBody })),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.validated.body.customer);
    if (!customer) throw new ApiError(404, 'Customer not found');
    const transaction = await Transaction.create({
      ...req.validated.body,
      date: req.validated.body.date ? new Date(req.validated.body.date) : new Date(),
      paymentMethod: req.validated.body.type === 'payment' ? req.validated.body.paymentMethod || 'cash' : null,
      createdBy: req.user._id
    });
    const updatedCustomer = await recalculateCustomer(customer._id);
    await logActivity(req, 'create', 'transaction', transaction._id, `${transaction.type} NPR ${transaction.amount}`, {
      customer: customer._id
    });
    req.app.get('io')?.emit('ledger:changed', { customer: updatedCustomer, transaction });
    res.status(201).json({ transaction, customer: updatedCustomer });
  })
);

router.put(
  '/:id',
  validate(z.object({ body: txBody.partial(), params: z.object({ id: z.string() }) })),
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.validated.params.id);
    if (!transaction) throw new ApiError(404, 'Transaction not found');
    Object.assign(transaction, {
      ...req.validated.body,
      date: req.validated.body.date ? new Date(req.validated.body.date) : transaction.date,
      updatedBy: req.user._id
    });
    await transaction.save();
    const customer = await recalculateCustomer(transaction.customer);
    await logActivity(req, 'update', 'transaction', transaction._id, 'Updated transaction');
    req.app.get('io')?.emit('ledger:changed', { customer, transaction });
    res.json({ transaction, customer });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) throw new ApiError(404, 'Transaction not found');
    const customerId = transaction.customer;
    await transaction.deleteOne();
    const customer = await recalculateCustomer(customerId);
    await logActivity(req, 'delete', 'transaction', req.params.id, 'Deleted transaction');
    req.app.get('io')?.emit('ledger:changed', { customer });
    res.json({ message: 'Transaction deleted', customer });
  })
);

export default router;
