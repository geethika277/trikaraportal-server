import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'demo', 'follow_up'],
    required: true,
  },
  relatedModel: { type: String, enum: ['Lead', 'Account', 'Opportunity', 'Project'], required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'relatedModel' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  outcome: { type: String, default: '' },
  nextAction: { type: String, default: '' },
  nextActionDate: { type: Date },
}, { timestamps: true });

export default mongoose.model('Activity', activitySchema);
