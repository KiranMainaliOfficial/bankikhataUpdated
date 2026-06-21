import express from 'express';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDateRange } from '../utils/ledger.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { start, end } = getDateRange(req.query);
    const [totals, topDebtors, transactions] = await Promise.all([
      Transaction.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: '$type',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Customer.find({ 'totals.balance': { $gt: 0 } }).sort({ 'totals.balance': -1 }).limit(10),
      Transaction.find({ date: { $gte: start, $lte: end } })
        .populate('customer', 'customerId fullName phone')
        .sort({ date: -1 })
    ]);

    const credit = totals.find((row) => row._id === 'credit')?.amount || 0;
    const collection = totals.find((row) => row._id === 'payment')?.amount || 0;
    const outstanding = await Customer.aggregate([
      { $group: { _id: null, amount: { $sum: '$totals.balance' } } }
    ]);

    res.json({
      range: { start, end },
      summary: {
        totalCredit: credit,
        totalCollection: collection,
        outstandingAmount: outstanding[0]?.amount || 0,
        netChange: credit - collection
      },
      topDebtors,
      transactions
    });
  })
);

export default router;
