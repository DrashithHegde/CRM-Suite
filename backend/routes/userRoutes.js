const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
    // Normalize field names for frontend compatibility
    const normalized = users.map((u) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));
    res.json({ success: true, data: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { full_name: username }] },
    });
    if (existingUser)
      return res.status(400).json({ success: false, message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        full_name: username || email,
        email,
        password_hash: hashedPassword,
        role: role || 'viewer',
      },
    });
    res.status(201).json({
      success: true,
      data: { id: user.id, name: user.full_name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    const id = parseInt(req.params.id);
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

    const data = {};
    if (username) data.full_name = username;
    if (email) data.email = email;
    if (role) data.role = role;
    if (password) data.password_hash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({ where: { id }, data });
    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.full_name,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.id === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
