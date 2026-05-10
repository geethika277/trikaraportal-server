import Project from '../models/Project.js';
import Lead from '../models/Lead.js';
import Opportunity from '../models/Opportunity.js';
import Issue from '../models/Issue.js';
import Task from '../models/Task.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';

export async function getDashboard(req, res) {
  const role = req.user.role;
  const userId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (role === 'superadmin' || role === 'project_manager') {
    const [projects, openIssues, pendingTasks, revenue, teamCount, activeProjects] = await Promise.all([
      Project.countDocuments({ status: 'active' }),
      Issue.countDocuments({ state: 'open' }),
      Task.countDocuments({ status: { $in: ['todo', 'in_progress'] } }),
      Invoice.aggregate([
        { $match: { status: 'paid', paidDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      User.countDocuments({ isActive: true }),
      Project.find({ status: 'active' })
        .populate('account', 'name')
        .sort('-updatedAt').limit(5),
    ]);

    const pipelineValue = await Opportunity.aggregate([
      { $match: { stage: { $nin: ['won', 'lost'] } } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);

    const issuesByStatus = await Issue.aggregate([
      { $group: { _id: '$mappedStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const revenueByMonth = await Invoice.aggregate([
      { $match: { status: 'paid', paidDate: { $gte: new Date(now.getFullYear(), 0, 1) } } },
      { $group: { _id: { month: { $month: '$paidDate' } }, total: { $sum: '$total' } } },
      { $sort: { '_id.month': 1 } },
    ]);

    return res.json({
      stats: {
        activeProjects: projects,
        openIssues,
        pendingTasks,
        monthRevenue: revenue[0]?.total || 0,
        teamCount,
        pipelineValue: pipelineValue[0]?.total || 0,
      },
      activeProjects,
      issuesByStatus,
      revenueByMonth,
    });
  }

  if (role === 'bde') {
    const [leads, opportunities, followUps, wonThisMonth] = await Promise.all([
      Lead.countDocuments({ assignedTo: userId, status: { $nin: ['converted', 'unqualified'] } }),
      Opportunity.find({ assignedTo: userId, stage: { $nin: ['won', 'lost'] } })
        .populate('account', 'name').sort('-updatedAt').limit(10),
      Lead.find({ assignedTo: userId, nextFollowUp: { $lte: new Date(Date.now() + 86400000) }, status: { $ne: 'converted' } })
        .sort('nextFollowUp').limit(10),
      Opportunity.aggregate([
        { $match: { assignedTo: userId, stage: 'won', actualCloseDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$value' }, count: { $sum: 1 } } },
      ]),
    ]);

    const leadsBySource = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    return res.json({ stats: { activeLeads: leads, wonThisMonth: wonThisMonth[0] || { total: 0, count: 0 } }, opportunities, followUps, leadsBySource });
  }

  if (role === 'accounting') {
    const summary = await Invoice.aggregate([
      {
        $facet: {
          draft: [{ $match: { status: 'draft' } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }],
          sent: [{ $match: { status: { $in: ['sent', 'viewed'] } } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }],
          paid: [{ $match: { status: 'paid', paidDate: { $gte: startOfMonth } } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }],
          overdue: [{ $match: { status: 'overdue' } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }],
        },
      },
    ]);
    const recentInvoices = await Invoice.find().populate('account', 'name').sort('-createdAt').limit(10);
    return res.json({ summary: summary[0], recentInvoices });
  }

  const myTasks = await Task.find({ assignedTo: userId, status: { $ne: 'done' } })
    .populate('project', 'title').sort('dueDate').limit(20);
  const myIssues = await Issue.find({ assignedInternally: userId, state: 'open' })
    .populate('repository', 'name').populate('project', 'title').sort('-githubUpdatedAt').limit(20);

  res.json({ myTasks, myIssues });
}
