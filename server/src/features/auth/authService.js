import bcrypt from 'bcrypt';
import User from '../../db/models/User.js';
import { signToken } from '../../utils/jwt.js';

export const registerUser = async ({ username, password }) => {
  const existing = await User.findOne({ username });
  if (existing) {
    return { error: 'Username already taken' };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  const token = signToken({ userId: user._id.toString(), username: user.username });
  return { user, token };
};

export const loginUser = async ({ username, password }) => {
  const user = await User.findOne({ username });
  if (!user) {
    return { error: 'Invalid credentials' };
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return { error: 'Invalid credentials' };
  }

  const token = signToken({ userId: user._id.toString(), username: user.username });
  return { user, token };
};
