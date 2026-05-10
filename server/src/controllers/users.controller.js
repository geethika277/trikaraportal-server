import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { paginationParams, paginate } from '../utils/pagination.js';

export async function listUsers(req, res) {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    User.find(filter).select('-passwordHash -refreshToken -githubAccessToken').skip(skip).limit(limit).sort('-createdAt'),
    User.countDocuments(filter),
  ]);
  res.json(paginate(data, total, page, limit));
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id).select('-passwordHash -refreshToken -githubAccessToken');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

export async function createUser(req, res) {
  const { name, email, password, role, phone, designation } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role, phone, designation });
  res.status(201).json(user.toSafeObject());
}

export async function updateUser(req, res) {
  const { name, role, phone, designation, avatar, isActive, githubUsername } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, role, phone, designation, avatar, isActive, githubUsername },
    { new: true }
  ).select('-passwordHash -refreshToken -githubAccessToken');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

export async function deleteUser(req, res) {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'User deactivated' });
}

export async function updateProfile(req, res) {
  const { name, phone, designation, avatar, githubUsername } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, designation, avatar, githubUsername },
    { new: true }
  ).select('-passwordHash -refreshToken -githubAccessToken');
  res.json(user);
}
