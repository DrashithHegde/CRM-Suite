const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

const generateToken = (id, nameOrEmail, role) => {
  return jwt.sign({ id, name: nameOrEmail, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { full_name: username }] },
    });

    if (existingUser)
      return res.status(400).json({ success: false, message: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { full_name: username || email, email, password_hash: hashed, role: 'viewer' },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.full_name || user.email, user.role),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body; // username may be email or full name

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: username }, { full_name: username }] },
    });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.full_name || user.email, user.role),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login };
