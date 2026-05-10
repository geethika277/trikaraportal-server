import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['superadmin', 'project_manager', 'developer', 'tester', 'bde', 'accounting'],
    required: true,
  },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  githubUsername: { type: String, default: '' },
  githubAccessToken: { type: String, default: '' },
  phone: { type: String, default: '' },
  designation: { type: String, default: '' },
  lastLogin: { type: Date },
  refreshToken: { type: String, default: '' },
}, { timestamps: true });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.githubAccessToken;
  return obj;
};

export default mongoose.model('User', userSchema);
