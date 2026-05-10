import Project from '../models/Project.js';
import Repository from '../models/Repository.js';
import { paginationParams, paginate } from '../utils/pagination.js';
import { notifyMany } from '../services/notification.js';

export async function listProjects(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.account) filter.account = req.query.account;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const role = req.user.role;
  if (['developer', 'tester'].includes(role)) {
    filter['team.user'] = req.user._id;
  }

  const [data, total] = await Promise.all([
    Project.find(filter)
      .populate('account', 'name')
      .populate('team.user', 'name avatar role')
      .skip(skip).limit(limit).sort('-updatedAt'),
    Project.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getProject(req, res) {
  const project = await Project.findById(req.params.id)
    .populate('account', 'name industry')
    .populate('opportunity', 'title stage value')
    .populate('team.user', 'name email avatar role githubUsername')
    .populate('repositories');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
}

export async function createProject(req, res) {
  const project = await Project.create(req.body);
  res.status(201).json(project);
}

export async function updateProject(req, res) {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('account', 'name')
    .populate('team.user', 'name avatar role');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
}

export async function deleteProject(req, res) {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: 'Project deleted' });
}

export async function addTeamMember(req, res) {
  const { userId, role } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const exists = project.team.some(m => m.user.toString() === userId);
  if (exists) return res.status(409).json({ message: 'User already in team' });

  project.team.push({ user: userId, role: role || 'member' });
  await project.save();

  await notifyMany([userId], {
    type: 'project_assigned',
    title: 'You were added to a project',
    message: project.title,
    relatedModel: 'Project',
    relatedId: project._id,
    link: `/projects/${project._id}`,
  });

  await project.populate('team.user', 'name avatar role');
  res.json(project.team);
}

export async function removeTeamMember(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  project.team = project.team.filter(m => m.user.toString() !== req.params.userId);
  await project.save();
  res.json({ message: 'Member removed' });
}

export async function updateEnvironment(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const envIndex = project.environments.findIndex(e => e.name === req.params.envName);
  if (envIndex >= 0) {
    project.environments[envIndex] = { ...project.environments[envIndex].toObject(), ...req.body };
  } else {
    project.environments.push({ name: req.params.envName, ...req.body });
  }
  await project.save();
  res.json(project.environments);
}
