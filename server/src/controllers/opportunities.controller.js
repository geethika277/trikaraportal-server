import Opportunity from '../models/Opportunity.js';
import Project from '../models/Project.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listOpportunities(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.account) filter.account = req.query.account;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
  const [data, total] = await Promise.all([
    Opportunity.find(filter)
      .populate('account', 'name')
      .populate('contact', 'name email')
      .populate('assignedTo', 'name avatar')
      .skip(skip).limit(limit).sort('-updatedAt'),
    Opportunity.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getOpportunity(req, res) {
  const opp = await Opportunity.findById(req.params.id)
    .populate('account', 'name industry')
    .populate('contact', 'name email phone')
    .populate('assignedTo', 'name avatar email')
    .populate('convertedToProject', 'title status');
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
  res.json(opp);
}

export async function createOpportunity(req, res) {
  const opp = await Opportunity.create({ ...req.body, assignedTo: req.body.assignedTo || req.user._id });
  res.status(201).json(opp);
}

export async function updateOpportunity(req, res) {
  const opp = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('account', 'name')
    .populate('assignedTo', 'name avatar');
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
  res.json(opp);
}

export async function deleteOpportunity(req, res) {
  await Opportunity.findByIdAndDelete(req.params.id);
  res.json({ message: 'Opportunity deleted' });
}

export async function convertToProject(req, res) {
  const opp = await Opportunity.findById(req.params.id).populate('account');
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
  if (opp.convertedToProject) return res.status(400).json({ message: 'Already converted to a project' });

  const project = await Project.create({
    title: req.body.title || opp.title,
    account: opp.account._id,
    opportunity: opp._id,
    type: req.body.type || 'new_development',
    status: 'scoping',
    budget: opp.value,
    currency: opp.currency,
    description: opp.description,
  });

  opp.stage = 'won';
  opp.convertedToProject = project._id;
  opp.convertedAt = new Date();
  opp.actualCloseDate = new Date();
  await opp.save();

  res.json({ project, opportunity: opp });
}

export async function getFunnelData(req, res) {
  const stages = ['qualification', 'proposal', 'negotiation', 'contract_sent', 'won', 'lost'];
  const results = await Promise.all(
    stages.map(async stage => {
      const [items, count, totalValue] = await Promise.all([
        Opportunity.find({ stage })
          .populate('account', 'name')
          .populate('assignedTo', 'name avatar')
          .sort('-updatedAt')
          .limit(50),
        Opportunity.countDocuments({ stage }),
        Opportunity.aggregate([
          { $match: { stage } },
          { $group: { _id: null, total: { $sum: '$value' } } },
        ]).then(r => r[0]?.total || 0),
      ]);
      return { stage, items, count, totalValue };
    })
  );
  res.json(results);
}
