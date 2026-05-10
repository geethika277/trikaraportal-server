import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, trim: true, default: '' },
  contactName: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  source: {
    type: String,
    enum: ['website', 'referral', 'linkedin', 'cold_call', 'event', 'partner', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'unqualified', 'converted'],
    default: 'new',
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  budget: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, default: '' },
  notes: { type: String, default: '' },
  nextFollowUp: { type: Date },
  convertedToAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  convertedAt: { type: Date },
  tags: [{ type: String }],
  location: { type: String, default: '' },
  website: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);
