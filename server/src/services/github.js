import { Octokit } from '@octokit/rest';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../config/env.js';
import Repository from '../models/Repository.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import { decrypt } from '../utils/encrypt.js';
import { notifyMany } from './notification.js';

export function getOctokit(token) {
  return new Octokit({ auth: token });
}

export function buildOAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: 'repo,admin:repo_hook',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function listUserRepos(token) {
  const octokit = getOctokit(token);
  const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: 'updated',
  });
  return repos.map(r => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    url: r.html_url,
    description: r.description,
    isPrivate: r.private,
    defaultBranch: r.default_branch,
  }));
}

export async function syncIssues(repoDoc) {
  const token = repoDoc.encryptedToken ? decrypt(repoDoc.encryptedToken) : null;
  if (!token) return { synced: 0 };

  const octokit = getOctokit(token);
  const [owner, repo] = repoDoc.fullName.split('/');

  const issues = await octokit.paginate(octokit.issues.listForRepo, {
    owner, repo, state: 'all', per_page: 100,
  });

  let synced = 0;
  for (const gh of issues) {
    if (gh.pull_request) continue;
    const mappedStatus = resolveMappedStatus(gh.labels, repoDoc.labelMappings);
    await Issue.findOneAndUpdate(
      { repository: repoDoc._id, githubId: gh.id },
      {
        project: repoDoc.project,
        githubId: gh.id,
        number: gh.number,
        title: gh.title,
        body: gh.body || '',
        state: gh.state,
        labels: gh.labels.map(l => ({ name: l.name, color: l.color })),
        mappedStatus,
        githubAssignees: gh.assignees.map(a => ({ login: a.login, avatarUrl: a.avatar_url })),
        milestone: gh.milestone ? { title: gh.milestone.title, dueOn: gh.milestone.due_on } : undefined,
        htmlUrl: gh.html_url,
        githubCreatedAt: gh.created_at,
        githubUpdatedAt: gh.updated_at,
      },
      { upsert: true, new: true }
    );
    synced++;
  }

  repoDoc.lastSyncedAt = new Date();
  await repoDoc.save();
  return { synced };
}

export function resolveMappedStatus(labels, mappings) {
  for (const label of labels) {
    const mapping = mappings.find(m => m.label === label.name);
    if (mapping) return mapping.mappedStatus;
  }
  return 'Backlog';
}

export function verifyWebhookSignature(rawBody, signature) {
  const sig = createHmac('sha256', env.GITHUB_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const expected = Buffer.from(`sha256=${sig}`);
  const received = Buffer.from(signature || '');
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function processWebhookEvent(event, payload) {
  if (event !== 'issues') return;

  const ghIssue = payload.issue;
  const repoFullName = payload.repository.full_name;
  const repoDoc = await Repository.findOne({ fullName: repoFullName });
  if (!repoDoc) return;

  const mappedStatus = resolveMappedStatus(ghIssue.labels, repoDoc.labelMappings);

  const issue = await Issue.findOneAndUpdate(
    { repository: repoDoc._id, githubId: ghIssue.id },
    {
      project: repoDoc.project,
      number: ghIssue.number,
      title: ghIssue.title,
      body: ghIssue.body || '',
      state: ghIssue.state,
      labels: ghIssue.labels.map(l => ({ name: l.name, color: l.color })),
      mappedStatus,
      githubAssignees: ghIssue.assignees.map(a => ({ login: a.login, avatarUrl: a.avatar_url })),
      githubUpdatedAt: ghIssue.updated_at,
    },
    { upsert: true, new: true }
  );

  const project = await Project.findById(repoDoc.project).select('team title');
  if (!project) return;

  const teamUserIds = project.team.map(m => m.user);
  await notifyMany(teamUserIds, {
    type: 'issue_updated',
    title: `Issue #${ghIssue.number} ${payload.action}`,
    message: ghIssue.title,
    relatedModel: 'Issue',
    relatedId: issue._id,
    link: `/projects/${project._id}/issues/${issue._id}`,
  });
}
