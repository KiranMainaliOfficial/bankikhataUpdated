import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

export async function recalculateCustomer(customerId) {
  const transactions = await Transaction.find({ customer: customerId }).sort({ date: 1, createdAt: 1 });
  let balance = 0;
  let credit = 0;
  let paid = 0;

  for (const tx of transactions) {
    if (tx.type === 'credit') {
      balance += tx.amount;
      credit += tx.amount;
    } else {
      balance -= tx.amount;
      paid += tx.amount;
    }
    tx.runningBalance = balance;
    await tx.save();
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    {
      totals: {
        credit,
        paid,
        balance,
        transactions: transactions.length
      },
      status: balance <= 0 ? 'paid' : 'active'
    },
    { new: true }
  );

  return customer;
}

export function getDateRange(query) {
  const now = new Date();
  const end = query.endDate ? new Date(query.endDate) : now;
  let start;

  if (query.startDate) {
    start = new Date(query.startDate);
  } else if (query.range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (query.range === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
  } else if (query.range === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  end.setHours(23, 59, 59, 999);
  return { start, end };
}
