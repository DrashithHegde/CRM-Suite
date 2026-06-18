const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      password_hash: hashedPassword,
      full_name: 'Admin User',
      role: 'admin',
    },
  });
  console.log(`✅ Admin user: ${admin.email} (${admin.full_name})`);

  // 2. Sample company
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Acme Corporation',
      industry: 'Technology',
      website: 'https://acme.com',
      phone: '+1-555-1234',
      address: '123 Tech Park, Silicon Valley, CA',
    },
  });
  console.log(`✅ Company: ${company.name}`);

  // 3. Sample contact
  const contact = await prisma.contact.upsert({
    where: { id: 1 },
    update: {},
    create: {
      company_id: company.id,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@acme.com',
      phone: '+1-555-5678',
      position: 'CTO',
    },
  });
  console.log(`✅ Contact: ${contact.first_name} ${contact.last_name}`);

  // 4. Sample deal
  const deal = await prisma.deal.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Enterprise License Deal',
      company_id: company.id,
      contact_id: contact.id,
      value: 150000.0,
      stage: 'proposal',
      expected_close_date: new Date('2026-12-31'),
    },
  });
  console.log(`✅ Deal: ${deal.name}`);

  // 5. Sample activity
  const activity = await prisma.activity.upsert({
    where: { id: 1 },
    update: {},
    create: {
      deal_id: deal.id,
      user_id: admin.id,
      type: 'meeting',
      subject: 'Initial Discovery Call',
      description: 'Discussed requirements and timeline for enterprise license.',
      due_date: new Date('2026-06-20'),
      is_completed: false,
    },
  });
  console.log(`✅ Activity: ${activity.subject}`);

  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Additional dummy leads and users for testing
async function seedMore() {
  const sampleLeads = [
    { name: 'Alice Smith', email: 'alice@example.com', phone: '+1-202-555-0111', source: 'referral', status: 'new' },
    { name: 'Bob Johnson', email: 'bob.johnson@example.com', phone: '+1-202-555-0122', source: 'website_form', status: 'contacted' },
    { name: 'Carol Lee', email: 'carol.lee@example.com', phone: '+1-202-555-0133', source: 'social_media', status: 'qualified' },
    { name: 'Daniel Kim', email: 'daniel.kim@example.com', phone: '+1-202-555-0144', source: 'email_campaign', status: 'converted' },
    { name: 'Eva Green', email: 'eva.green@example.com', phone: '+1-202-555-0155', source: 'referral', status: 'lost' },
  ];

  for (const l of sampleLeads) {
    const lead = await prisma.lead.upsert({
      where: { email: l.email },
      update: {},
      create: {
        name: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        status: l.status,
      },
    });
    // attach tags for demo
    await prisma.lead.update({ where: { id: lead.id }, data: { tags: { connectOrCreate: [{ where: { name: 'demo' }, create: { name: 'demo' } }, { where: { name: l.source }, create: { name: l.source } }] } } });
    console.log(`+ Lead: ${l.email}`);
  }

  // sample users
  const users = [
    { email: 'sales1@crm.com', name: 'Sales One', role: 'sales', pass: 'password1' },
    { email: 'sales2@crm.com', name: 'Sales Two', role: 'sales', pass: 'password2' },
  ];

  for (const u of users) {
    const hp = await bcrypt.hash(u.pass, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, password_hash: hp, full_name: u.name, role: u.role },
    });
    console.log(`+ User: ${u.email}`);
  }
}

// Run supplemental seeding without duplicating main seed
seedMore().catch((e) => {
  console.error('❌ Supplemental seeding error:', e);
});
