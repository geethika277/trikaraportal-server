import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  designation: { type: String, default: '' },
  department: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false },
  linkedIn: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Contact', contactSchema);
