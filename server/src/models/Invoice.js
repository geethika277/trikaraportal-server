import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  issuedDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  lineItems: [lineItemSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  notes: { type: String, default: '' },
  paymentTerms: { type: String, default: 'Net 30' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: { type: Date },
  reminderSentAt: { type: Date },
}, { timestamps: true });

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `TRK-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  this.subtotal = this.lineItems.reduce((s, i) => s + i.amount, 0);
  this.taxAmount = +(this.subtotal * this.taxRate / 100).toFixed(2);
  this.total = +(this.subtotal + this.taxAmount).toFixed(2);
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
