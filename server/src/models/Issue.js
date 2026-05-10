import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  repository: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  githubId: { type: Number, required: true },
  number: { type: Number, required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  state: { type: String, enum: ['open', 'closed'], default: 'open' },
  labels: [{ name: String, color: String }],
  mappedStatus: { type: String, default: 'Backlog' },
  githubAssignees: [{ login: String, avatarUrl: String }],
  assignedInternally: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  milestone: { title: String, dueOn: Date },
  htmlUrl: { type: String, default: '' },
  githubCreatedAt: { type: Date },
  githubUpdatedAt: { type: Date },
  internalNotes: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  estimatedHours: { type: Number, default: 0 },
}, { timestamps: true });

issueSchema.index({ repository: 1, githubId: 1 }, { unique: true });

export default mongoose.model('Issue', issueSchema);
