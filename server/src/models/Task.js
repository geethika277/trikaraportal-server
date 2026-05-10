import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  type: {
    type: String,
    enum: ['development', 'testing', 'review', 'bde', 'accounting', 'design', 'other'],
    default: 'other',
  },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done', 'blocked'],
    default: 'todo',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  labels: [{ type: String }],
  attachments: [{ name: String, url: String }],
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
