import Account from '../models/Account.js';
import Contact from '../models/Contact.js';
import Opportunity from '../models/Opportunity.js';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listAccounts(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.tier) filter.tier = req.query.tier;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { industry: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const [data, total] = await Promise.all([
    Account.find(filter).populate('assignedTo', 'name email avatar').skip(skip).limit(limit).sort('-createdAt'),
    Account.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getAccount(req, res) {
  const account = await Account.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('convertedFrom', 'title status');
  if (!account) return res.status(404).json({ message: 'Account not found' });

  const [contacts, opportunities, projects, invoices] = await Promise.all([
    Contact.find({ account: account._id }),
    Opportunity.find({ account: account._id }).populate('assignedTo', 'name avatar').sort('-createdAt'),
    Project.find({ account: account._id }).sort('-createdAt'),
    Invoice.find({ account: account._id }).sort('-createdAt').limit(10),
  ]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);

  res.json({ account, contacts, opportunities, projects, invoices, totalRevenue });
}

export async function createAccount(req, res) {
  const account = await Account.create(req.body);
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('assignedTo', 'name email avatar');
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json(account);
}

export async function deleteAccount(req, res) {
  await Account.findByIdAndDelete(req.params.id);
  res.json({ message: 'Account deleted' });
}
