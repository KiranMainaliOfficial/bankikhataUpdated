import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, unique: true, index: true },
    fullName: { type: String, required: true, trim: true, index: 'text' },
    phone: { type: String, required: true, trim: true, index: true },
    alternatePhone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    dueDate: Date,
    creditLimit: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'paid', 'overdue', 'inactive'], default: 'active' },
    totals: {
      credit: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

customerSchema.pre('save', async function setCustomerId(next) {
  if (this.customerId) return next();
  const count = await mongoose.model('Customer').countDocuments();
  this.customerId = `BK-${String(count + 1).padStart(5, '0')}`;
  return next();
});

export default mongoose.model('Customer', customerSchema);
