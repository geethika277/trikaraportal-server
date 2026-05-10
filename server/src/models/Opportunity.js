import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  stage: {
    type: String,
    enum: ['qualification', 'proposal', 'negotiation', 'contract_sent', 'won', 'lost'],
    default: 'qualification',
  },
  value: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  probability: { type: Number, default: 20, min: 0, max: 100 },
  expectedCloseDate: { type: Date },
  actualCloseDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serviceType: {
    type: String,
    enum: ['new_development', 'modification', 'maintenance', 'support', 'consulting'],
    default: 'new_development',
  },
  description: { type: String, default: '' },
  lostReason: { type: String, default: '' },
  notes: { type: String, default: '' },
  convertedToProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  convertedAt: { type: Date },
  tags: [{ type: String }],
  competitorInfo: { type: String, default: '' },
  nextStep: { type: String, default: '' },
}, { timestamps: true });

opportunitySchema.pre('save', function (next) {
  const stageProbabilities = {
    qualification: 20,
    proposal: 40,
    negotiation: 65,
    contract_sent: 85,
    won: 100,
    lost: 0,
  };
  if (this.isModified('stage')) {
    this.probability = stageProbabilities[this.stage];
  }
  next();
});

export default mongoose.model('Opportunity', opportunitySchema);
