const prisma = require('../prismaClient');
const { getIo } = require('../socket');

const createLead = async (req, res) => {
  try {
    const { name, email, phone, source, tags = [] } = req.body;

    const existingLead = await prisma.lead.findFirst({ where: { email } });
    if (existingLead)
      return res
        .status(400)
        .json({ success: false, message: 'Lead with this email already exists' });

    const tagOps = tags.map((t) => ({
      where: { name: t },
      create: { name: t },
    }));

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        source: source || 'website_form',
        status: 'new',
        tags: { connectOrCreate: tagOps },
      },
      include: { tags: true },
    });

    res.status(201).json({ success: true, data: lead });
    try {
      const io = getIo();
      if (io) io.emit('lead-created', { message: 'New lead added', data: lead });
    } catch (e) {
      console.warn('Socket emit failed for lead-created', e.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeads = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [count, rows] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { tags: true } }),
    ]);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / take),
        limit: take,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const updated = await prisma.lead.update({ where: { id }, data: { status } });
    res.json({ success: true, data: updated });
    try {
      const io = getIo();
      if (io) io.emit('lead-status-updated', { message: 'Lead status updated', data: updated });
    } catch (e) {
      console.warn('Socket emit failed for lead-status-updated', e.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    // Convert notes endpoint to tags endpoint: accepts { tags: [] }
    const { tags = [] } = req.body;
    const id = parseInt(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const tagOps = tags.map((t) => ({ where: { name: t }, create: { name: t } }));

    const updated = await prisma.lead.update({
      where: { id },
      data: { tags: { connectOrCreate: tagOps } },
      include: { tags: true },
    });

    res.json({ success: true, data: updated });
    try {
      const io = getIo();
      if (io) io.emit('note-added', { message: 'Tags updated for lead', data: updated });
    } catch (e) {
      console.warn('Socket emit failed for note-added', e.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const totalLeads = await prisma.lead.count();
    const newLeads = await prisma.lead.count({ where: { status: 'new' } });
    const contactedLeads = await prisma.lead.count({ where: { status: 'contacted' } });
    const convertedLeads = await prisma.lead.count({ where: { status: 'converted' } });

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        contactedLeads,
        convertedLeads,
        conversionRate: parseFloat(conversionRate),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateLead = async (req, res) => {
  try {
    const { name, email, phone, source, tags } = req.body;
    const id = parseInt(req.params.id);
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Lead not found' });

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (source) data.source = source;
    if (Array.isArray(tags)) {
      const tagOps = tags.map((t) => ({ where: { name: t }, create: { name: t } }));
      data.tags = { set: [], connectOrCreate: tagOps };
    }

    const updated = await prisma.lead.update({ where: { id }, data });
    res.json({ success: true, data: updated });
    try {
      const io = getIo();
      if (io) io.emit('lead-updated', { message: 'Lead updated', data: updated });
    } catch (e) {
      console.warn('Socket emit failed for lead-updated', e.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const deleteLead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Lead not found' });

    await prisma.lead.delete({ where: { id } });
    res.json({ success: true, message: 'Lead deleted successfully' });
    try {
      const io = getIo();
      if (io) io.emit('lead-deleted', { message: 'Lead deleted', data: { id } });
    } catch (e) {
      console.warn('Socket emit failed for lead-deleted', e.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportLeadsCsv = async (req, res) => {
  try {
    const rows = await prisma.lead.findMany({ include: { tags: true }, orderBy: { createdAt: 'desc' } });
    const header = ['id', 'name', 'email', 'phone', 'source', 'status', 'tags', 'createdAt'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const tagNames = (r.tags || []).map((t) => t.name).join(';');
      const vals = [r.id, r.name, r.email, r.phone || '', r.source, r.status, `"${tagNames}"`, r.createdAt.toISOString()];
      lines.push(vals.join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  createLead,
  getLeads,
  updateLeadStatus,
  addNote,
  updateLead,
  deleteLead,
  getAnalytics,
  exportLeadsCsv,
};
