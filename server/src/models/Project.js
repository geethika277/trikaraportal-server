import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema({
  name: { type: String, enum: ['dev', 'staging', 'qa', 'production'], required: true },
  url: { type: String, default: '' },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const serviceSchema = new mongoose.Schema({
  name: { type: String, enum: ['backend', 'frontend', 'android', 'ios', 'other'], required: true },
  description: { type: String, default: '' },
  repository: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository' },
  techStack: [{ type: String }],
}, { _id: true });

const teamMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, default: 'member' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  type: {
    type: String,
    enum: ['new_development', 'modification_fix', 'maintenance_support'],
    required: true,
  },
  status: {
    type: String,
    enum: ['scoping', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'scoping',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  startDate: { type: Date },
  endDate: { type: Date },
  budget: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  description: { type: String, default: '' },
  techStack: [{ type: String }],
  tags: [{ type: String }],
  team: [teamMemberSchema],
  environments: [environmentSchema],
  services: [serviceSchema],
  repositories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Repository' }],
  color: { type: String, default: '#6366f1' },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
