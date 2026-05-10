import { Router } from 'express';
import { listProjects, getProject, createProject, updateProject, deleteProject, addTeamMember, removeTeamMember, updateEnvironment } from '../controllers/projects.controller.js';
import { listRepos, addRepo, updateRepo, deleteRepo, triggerSync, listGithubRepos } from '../controllers/repositories.controller.js';
import { listIssues, getIssue, updateIssue, getIssuesByStatus, getMyIssues } from '../controllers/issues.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES, ALL_ROLES, PROJECT_ROLES } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', listProjects);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.PM), createProject);
router.get('/my-issues', getMyIssues);
router.get('/github/repos', listGithubRepos);

router.get('/:id', getProject);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.PM), updateProject);
router.delete('/:id', authorize(ROLES.SUPERADMIN), deleteProject);

router.post('/:id/team', authorize(ROLES.SUPERADMIN, ROLES.PM), addTeamMember);
router.delete('/:id/team/:userId', authorize(ROLES.SUPERADMIN, ROLES.PM), removeTeamMember);
router.put('/:id/environments/:envName', authorize(ROLES.SUPERADMIN, ROLES.PM), updateEnvironment);

router.get('/:projectId/repos', listRepos);
router.post('/:projectId/repos', authorize(ROLES.SUPERADMIN, ROLES.PM), addRepo);
router.put('/:projectId/repos/:id', authorize(ROLES.SUPERADMIN, ROLES.PM), updateRepo);
router.delete('/:projectId/repos/:id', authorize(ROLES.SUPERADMIN, ROLES.PM), deleteRepo);
router.post('/:projectId/repos/:id/sync', authorize(ROLES.SUPERADMIN, ROLES.PM), triggerSync);

router.get('/:projectId/issues', listIssues);
router.get('/:projectId/issues/board', getIssuesByStatus);
router.get('/:projectId/issues/:id', getIssue);
router.put('/:projectId/issues/:id', updateIssue);

export default router;
