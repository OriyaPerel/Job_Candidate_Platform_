import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.userId) return res.status(401).json({ message: 'Invalid token payload' });
    req.user = { _id: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}
