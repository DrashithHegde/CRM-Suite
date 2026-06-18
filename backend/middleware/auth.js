const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const userId = parseInt(decoded.id, 10);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          created_at: true,
          updated_at: true,
        },
      });
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
