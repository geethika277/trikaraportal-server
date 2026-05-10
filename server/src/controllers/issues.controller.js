import Issue from '../models/Issue.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listIssues(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = { project: req.params.projectId };
  if (req.query.state) filter.state = req.query.state;
  if (req.query.mappedStatus) filter.mappedStatus = req.query.mappedStatus;
  if (req.query.repository) filter.repository = req.query.repository;
  if (req.query.assignedTo) filter.assignedInternally = req.query.assignedTo;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Issue.find(filter)
      .populate('repository', 'name fullName')
      .populate('assignedInternally', 'name avatar githubUsername')
      .skip(skip).limit(limit).sort('-githubUpdatedAt'),
    Issue.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getIssue(req, res) {
  const issue = await Issue.findById(req.params.id)
    .populate('repository', 'name fullName url')
    .populate('assignedInternally', 'name avatar email githubUsername');
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  res.json(issue);
}

export async function updateIssue(req, res) {
  const { internalNotes, priority, assignedInternally } = req.body;
  const issue = await Issue.findByIdAndUpdate(
    req.params.id,
    { internalNotes, priority, assignedInternally },
    { new: true }
  ).populate('assignedInternally', 'name avatar');
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  res.json(issue);
}

export async function getIssuesByStatus(req, res) {
  const issues = await Issue.aggregate([
    { $match: { project: new (await import('mongoose')).default.Types.ObjectId(req.params.projectId) } },
    { $group: { _id: '$mappedStatus', count: { $sum: 1 }, issues: { $push: '$$ROOT' } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(issues);
}

export async function getMyIssues(req, res) {
  const issues = await Issue.find({ assignedInternally: req.user._id, state: 'open' })
    .populate('repository', 'name fullName')
    .populate('project', 'title')
    .sort('-githubUpdatedAt')
    .limit(50);
  res.json(issues);
}
