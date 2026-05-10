import Lead from '../models/Lead.js';
import Account from '../models/Account.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listLeads(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search, $options: 'i' } },
      { contactName: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const [data, total] = await Promise.all([
    Lead.find(filter).populate('assignedTo', 'name email avatar').skip(skip).limit(limit).sort('-createdAt'),
    Lead.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getLead(req, res) {
  const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email avatar').populate('convertedToAccount', 'name');
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json(lead);
}

export async function createLead(req, res) {
  const lead = await Lead.create({ ...req.body, assignedTo: req.body.assignedTo || req.user._id });
  res.status(201).json(lead);
}

export async function updateLead(req, res) {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('assignedTo', 'name email avatar');
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json(lead);
}

export async function deleteLead(req, res) {
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ message: 'Lead deleted' });
}

export async function convertLead(req, res) {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  if (lead.status === 'converted') return res.status(400).json({ message: 'Lead already converted' });

  const account = await Account.create({
    name: req.body.accountName || lead.company || lead.title,
    industry: req.body.industry || '',
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    convertedFrom: lead._id,
    assignedTo: lead.assignedTo,
    tier: 'prospect',
  });

  lead.status = 'converted';
  lead.convertedToAccount = account._id;
  lead.convertedAt = new Date();
  await lead.save();

  res.json({ account, lead });
}

export async function getLeadsByStatus(req, res) {
  const statuses = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];
  const results = await Promise.all(
    statuses.map(async status => {
      const [items, count] = await Promise.all([
        Lead.find({ status }).populate('assignedTo', 'name avatar').sort('-createdAt').limit(50),
        Lead.countDocuments({ status }),
      ]);
      return { status, items, count };
    })
  );
  res.json(results);
}
