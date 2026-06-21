import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: ['credit', 'payment'], required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    productOrReason: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'esewa', 'khalti', 'bank_transfer', 'other', null],
      default: null
    },
    notes: { type: String, trim: true },
    runningBalance: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
