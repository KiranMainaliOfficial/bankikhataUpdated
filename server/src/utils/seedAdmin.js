import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

dotenv.config({ path: '../.env' });
dotenv.config();

await connectDB();

const email = process.env.ADMIN_EMAIL;
const existing = await User.findOne({ email });

if (!existing) {
  await User.create({
    name: 'BankiKhata Admin',
    email,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin'
  });
  console.log(`Created admin user: ${email}`);
} else {
  console.log(`Admin user already exists: ${email}`);
}

await Settings.findOneAndUpdate(
  {},
  { businessName: process.env.BUSINESS_NAME || 'BankiKhata Mainali Store', currency: 'NPR' },
  { upsert: true }
);

process.exit(0);
