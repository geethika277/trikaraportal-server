import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import User from '../models/User.js';

function signAccess(userId) {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
}

function signRefresh(userId) {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

export async function register(req, res) {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });

  const accessToken = signAccess(user._id);
  const refreshToken = signRefresh(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user: user.toSafeObject() });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = signAccess(user._id);
  const refreshToken = signRefresh(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user: user.toSafeObject() });
}

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.refreshToken !== token || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const accessToken = signAccess(user._id);
    res.json({ accessToken, user: user.toSafeObject() });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  if (token) {
    await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: '' });
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ message: 'Logged out' });
}

export async function getMe(req, res) {
  res.json(req.user);
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: 'Password updated' });
}
