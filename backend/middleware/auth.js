import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  // look in Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  // fallback to cookies (authToken or token)
  if (!token && req.cookies) {
    token = req.cookies.jwt || req.cookies.token || null;
  }

  if (!token) return res.status(401).json({ message: 'Missing token' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // console.log(err);
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user; // { id: userId, email: userEmail }
    next();
  });
}
