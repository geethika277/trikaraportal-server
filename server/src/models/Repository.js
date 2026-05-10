import mongoose from 'mongoose';

const labelMappingSchema = new mongoose.Schema({
  label: { type: String, required: true },
  mappedStatus: { type: String, required: true },
  color: { type: String, default: '#6366f1' },
}, { _id: false });

const repositorySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  url: { type: String, default: '' },
  githubId: { type: Number },
  description: { type: String, default: '' },
  isPrivate: { type: Boolean, default: false },
  defaultBranch: { type: String, default: 'main' },
  encryptedToken: { type: String, default: '' },
  installationType: { type: String, enum: ['oauth', 'pat'], default: 'oauth' },
  labelMappings: [labelMappingSchema],
  lastSyncedAt: { type: Date },
  syncEnabled: { type: Boolean, default: true },
  webhookId: { type: Number },
  webhookSecret: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Repository', repositorySchema);
