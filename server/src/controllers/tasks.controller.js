import Task from '../models/Task.js';
import { paginationParams, paginate } from '../utils/pagination.js';
import { notifyMany } from '../services/notification.js';

export async function listTasks(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const role = req.user.role;
  if (['developer', 'tester', 'bde', 'accounting'].includes(role)) {
    filter.assignedTo = req.user._id;
  }

  const [data, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar')
      .populate('project', 'title')
      .skip(skip).limit(limit).sort('-updatedAt'),
    Task.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getTask(req, res) {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name avatar email')
    .populate('createdBy', 'name avatar')
    .populate('project', 'title')
    .populate('issue', 'title number htmlUrl');
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
}

export async function createTask(req, res) {
  const task = await Task.create({ ...req.body, createdBy: req.user._id });
  if (task.assignedTo?.length) {
    await notifyMany(task.assignedTo, {
      type: 'task_assigned',
      title: 'New task assigned',
      message: task.title,
      relatedModel: 'Task',
      relatedId: task._id,
      link: `/tasks/${task._id}`,
    });
  }
  res.status(201).json(task);
}

export async function updateTask(req, res) {
  if (req.body.status === 'done' && !req.body.completedAt) {
    req.body.completedAt = new Date();
  }
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('assignedTo', 'name avatar')
    .populate('project', 'title');
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
}

export async function deleteTask(req, res) {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Task deleted' });
}

export async function getMyTasks(req, res) {
  const tasks = await Task.find({ assignedTo: req.user._id, status: { $ne: 'done' } })
    .populate('project', 'title')
    .sort('dueDate')
    .limit(100);
  res.json(tasks);
}
