import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  industry: { type: String, default: '' },
  website: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  logo: { type: String, default: '' },
  tier: { type: String, enum: ['prospect', 'active', 'churned'], default: 'prospect' },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zip: String,
  },
  convertedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, default: '' },
  notes: { type: String, default: '' },
  tags: [{ type: String }],
  annualRevenue: { type: Number, default: 0 },
  employeeCount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
}, { timestamps: true });

export default mongoose.model('Account', accountSchema);
