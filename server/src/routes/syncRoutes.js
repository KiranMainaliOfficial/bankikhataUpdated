import express from 'express';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import Settings from '../models/Settings.js';
import { authorize, protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { syncRowsToGoogleSheets } from '../utils/googleSheets.js';

const router = express.Router();
router.use(protect, authorize('admin'));

router.post(
  '/google-sheets',
  //   try {
  //     console.log("EMAIL:", process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  //     console.log("KEY EXISTS:", !!process.env.GOOGLE_SHEETS_PRIVATE_KEY);
  //     console.log("SHEET ID:", process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
  //     const result = await syncRowsToGoogleSheets(
  //       'Customers',
  //       [
  //         ['Name', 'Balance'],
  //         ['Kiran', 5000],
  //         ['Ram', 2500]
  //       ]
  //     );

  //     res.json(result);
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({
  //       error: err.message
  //     });
  //   }
  // });
  asyncHandler(async (_req, res) => {
    const customers = await Customer.find().lean();
    const transactions = await Transaction.find().populate('customer', 'customerId fullName phone').lean();

    const customerRows = [
      ['Customer ID', 'Full Name', 'Phone', 'Address', 'Total Credit', 'Total Paid', 'Balance'],
      ...customers.map((customer) => [
        customer.customerId,
        customer.fullName,
        customer.phone,
        customer.address || '',
        customer.totals.credit,
        customer.totals.paid,
        customer.totals.balance
      ])
    ];

    const txRows = [
      ['Date', 'Customer ID', 'Customer', 'Type', 'Amount', 'Method', 'Notes'],
      ...transactions.map((tx) => [
        tx.date,
        tx.customer?.customerId,
        tx.customer?.fullName,
        tx.type,
        tx.amount,
        tx.paymentMethod || '',
        tx.notes || ''
      ])
    ];

    const result = {
      customers: await syncRowsToGoogleSheets('Customers', customerRows),
      transactions: await syncRowsToGoogleSheets('Transactions', txRows)
    };

    await Settings.findOneAndUpdate({}, { 'googleSheets.lastSyncAt': new Date() }, { upsert: true });
    res.json({ result });
  })
);

export default router;
