import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';
import bcrypt from 'bcryptjs';


const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return res.json({
    token,
    user: { _id: user._id, email: user.email, name: user.name }
  });
});

export default router;
