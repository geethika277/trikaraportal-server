import Invoice from '../models/Invoice.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listInvoices(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.account) filter.account = req.query.account;
  if (req.query.project) filter.project = req.query.project;
  const [data, total] = await Promise.all([
    Invoice.find(filter)
      .populate('account', 'name')
      .populate('project', 'title')
      .populate('createdBy', 'name')
      .skip(skip).limit(limit).sort('-createdAt'),
    Invoice.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id)
    .populate('account', 'name address email phone')
    .populate('project', 'title')
    .populate('contact', 'name email')
    .populate('createdBy', 'name');
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json(invoice);
}

export async function createInvoice(req, res) {
  const invoice = await Invoice.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(invoice);
}

export async function updateInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  if (['paid', 'cancelled'].includes(invoice.status) && req.user.role !== 'superadmin') {
    return res.status(400).json({ message: 'Cannot edit a paid or cancelled invoice' });
  }
  Object.assign(invoice, req.body);
  await invoice.save();
  res.json(invoice);
}

export async function updateInvoiceStatus(req, res) {
  const { status } = req.body;
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  invoice.status = status;
  if (status === 'sent') invoice.sentAt = new Date();
  if (status === 'paid') invoice.paidDate = new Date();
  await invoice.save();
  res.json(invoice);
}

export async function deleteInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  if (invoice.status === 'paid') return res.status(400).json({ message: 'Cannot delete a paid invoice' });
  await invoice.deleteOne();
  res.json({ message: 'Invoice deleted' });
}

export async function getRevenueSummary(req, res) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [monthRevenue, yearRevenue, outstanding, overdue] = await Promise.all([
    Invoice.aggregate([
      { $match: { status: 'paid', paidDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { status: 'paid', paidDate: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { status: { $in: ['sent', 'viewed'] } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    monthRevenue: monthRevenue[0]?.total || 0,
    yearRevenue: yearRevenue[0]?.total || 0,
    outstanding: { total: outstanding[0]?.total || 0, count: outstanding[0]?.count || 0 },
    overdue: { total: overdue[0]?.total || 0, count: overdue[0]?.count || 0 },
  });
}
