import Repository from '../models/Repository.js';
import Project from '../models/Project.js';
import { encrypt } from '../utils/encrypt.js';
import { syncIssues, listUserRepos } from '../services/github.js';

export async function listRepos(req, res) {
  const repos = await Repository.find({ project: req.params.projectId }).populate('addedBy', 'name avatar');
  res.json(repos);
}

export async function addRepo(req, res) {
  const { fullName, name, url, githubId, description, isPrivate, defaultBranch, token } = req.body;
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const repo = await Repository.create({
    project: project._id,
    name,
    fullName,
    url,
    githubId,
    description,
    isPrivate,
    defaultBranch: defaultBranch || 'main',
    encryptedToken: token ? encrypt(token) : '',
    addedBy: req.user._id,
    labelMappings: [
      { label: 'bug', mappedStatus: 'Bug Fix', color: '#d73a4a' },
      { label: 'enhancement', mappedStatus: 'Enhancement', color: '#a2eeef' },
      { label: 'in progress', mappedStatus: 'In Progress', color: '#0075ca' },
      { label: 'review', mappedStatus: 'In Review', color: '#e4e669' },
      { label: 'done', mappedStatus: 'Done', color: '#0e8a16' },
    ],
  });

  project.repositories.addToSet(repo._id);
  await project.save();

  res.status(201).json(repo);
}

export async function updateRepo(req, res) {
  const { labelMappings, syncEnabled, token } = req.body;
  const update = { labelMappings, syncEnabled };
  if (token) update.encryptedToken = encrypt(token);

  const repo = await Repository.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!repo) return res.status(404).json({ message: 'Repository not found' });
  res.json(repo);
}

export async function deleteRepo(req, res) {
  const repo = await Repository.findByIdAndDelete(req.params.id);
  if (repo) {
    await Project.findByIdAndUpdate(repo.project, { $pull: { repositories: repo._id } });
  }
  res.json({ message: 'Repository removed' });
}

export async function triggerSync(req, res) {
  const repo = await Repository.findById(req.params.id);
  if (!repo) return res.status(404).json({ message: 'Repository not found' });
  const result = await syncIssues(repo);
  res.json(result);
}

export async function listGithubRepos(req, res) {
  const token = req.query.token;
  if (!token) return res.status(400).json({ message: 'Token required' });
  const repos = await listUserRepos(token);
  res.json(repos);
}
