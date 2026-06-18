require('dotenv').config();
const prisma = require('../prismaClient');

const connectDB = async () => {
  if (process.env.DATABASE_URL) {
    await prisma.$connect();
    console.log('Connected to database');
  } else {
    console.warn('DATABASE_URL not set; skipping database connect');
  }
};

module.exports = { connectDB };
