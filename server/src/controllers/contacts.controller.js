import Contact from '../models/Contact.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listContacts(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.account) filter.account = req.query.account;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const [data, total] = await Promise.all([
    Contact.find(filter).populate('account', 'name').skip(skip).limit(limit).sort('-createdAt'),
    Contact.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getContact(req, res) {
  const contact = await Contact.findById(req.params.id).populate('account', 'name industry');
  if (!contact) return res.status(404).json({ message: 'Contact not found' });
  res.json(contact);
}

export async function createContact(req, res) {
  const contact = await Contact.create(req.body);
  res.status(201).json(contact);
}

export async function updateContact(req, res) {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('account', 'name');
  if (!contact) return res.status(404).json({ message: 'Contact not found' });
  res.json(contact);
}

export async function deleteContact(req, res) {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ message: 'Contact deleted' });
}
