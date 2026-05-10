import Activity from '../models/Activity.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listActivities(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.relatedModel) filter.relatedModel = req.query.relatedModel;
  if (req.query.relatedId) filter.relatedId = req.query.relatedId;
  if (req.query.type) filter.type = req.query.type;
  const [data, total] = await Promise.all([
    Activity.find(filter).populate('createdBy', 'name avatar').skip(skip).limit(limit).sort('-date'),
    Activity.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function createActivity(req, res) {
  const activity = await Activity.create({ ...req.body, createdBy: req.user._id });
  await activity.populate('createdBy', 'name avatar');
  res.status(201).json(activity);
}

export async function updateActivity(req, res) {
  const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('createdBy', 'name avatar');
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  res.json(activity);
}

export async function deleteActivity(req, res) {
  await Activity.findByIdAndDelete(req.params.id);
  res.json({ message: 'Activity deleted' });
}
