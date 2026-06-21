import express from 'express';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const settings = (await Settings.findOne()) || {};
    const overdueCutoff = new Date();
    overdueCutoff.setDate(overdueCutoff.getDate() - (settings.reminderDays || 30));

    const [customerStats, txStats, todayCollection, monthCollection, overdueAmount, topDebtors] =
      await Promise.all([
        Customer.aggregate([
          {
            $group: {
              _id: null,
              totalCustomers: { $sum: 1 },
              totalOutstandingCredit: { $sum: '$totals.balance' },
              totalPaidAmount: { $sum: '$totals.paid' }
            }
          }
        ]),
        Transaction.aggregate([
          {
            $group: {
              _id: null,
              totalTransactions: { $sum: 1 },
              totalCredit: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
              totalCollection: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } }
            }
          }
        ]),
        Transaction.aggregate([
          { $match: { type: 'payment', date: { $gte: todayStart } } },
          { $group: { _id: null, amount: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { type: 'payment', date: { $gte: monthStart } } },
          { $group: { _id: null, amount: { $sum: '$amount' } } }
        ]),
        Customer.aggregate([
          { $match: { dueDate: { $lt: overdueCutoff }, 'totals.balance': { $gt: 0 } } },
          { $group: { _id: null, amount: { $sum: '$totals.balance' } } }
        ]),
        Customer.find({ 'totals.balance': { $gt: 0 } }).sort({ 'totals.balance': -1 }).limit(8)
      ]);

    const monthly = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const customerGrowth = await Customer.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          customers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      summary: {
        totalCustomers: customerStats[0]?.totalCustomers || 0,
        totalOutstandingCredit: customerStats[0]?.totalOutstandingCredit || 0,
        totalPaidAmount: customerStats[0]?.totalPaidAmount || 0,
        totalTransactions: txStats[0]?.totalTransactions || 0,
        todayCollection: todayCollection[0]?.amount || 0,
        thisMonthCollection: monthCollection[0]?.amount || 0,
        overdueAmount: overdueAmount[0]?.amount || 0
      },
      monthly,
      topDebtors,
      customerGrowth
    });
  })
);

export default router;
