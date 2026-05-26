import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Account from '../models/Account.js';
import Contact from '../models/Contact.js';
import Opportunity from '../models/Opportunity.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Invoice from '../models/Invoice.js';

export async function runSeed() {
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Account.deleteMany({}),
    Contact.deleteMany({}),
    Opportunity.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Invoice.deleteMany({}),
  ]);

  const hash = pwd => bcrypt.hash(pwd, 12);

  const [superadmin, pm, dev, tester, bde, accounting] = await Promise.all([
    User.create({ name: 'Arjun Trikara', email: 'admin@trikara.dev', passwordHash: await hash('Admin@123'), role: 'superadmin', designation: 'Founder & CEO' }),
    User.create({ name: 'Priya Menon', email: 'priya@trikara.dev', passwordHash: await hash('Test@123'), role: 'project_manager', designation: 'Project Manager' }),
    User.create({ name: 'Karthik Dev', email: 'karthik@trikara.dev', passwordHash: await hash('Test@123'), role: 'developer', designation: 'Senior Developer' }),
    User.create({ name: 'Sneha QA', email: 'sneha@trikara.dev', passwordHash: await hash('Test@123'), role: 'tester', designation: 'QA Engineer' }),
    User.create({ name: 'Rahul Sales', email: 'rahul@trikara.dev', passwordHash: await hash('Test@123'), role: 'bde', designation: 'Business Development Executive' }),
    User.create({ name: 'Lakshmi Finance', email: 'lakshmi@trikara.dev', passwordHash: await hash('Test@123'), role: 'accounting', designation: 'Finance Manager' }),
  ]);

  const lead1 = await Lead.create({
    title: 'E-commerce Platform Build',
    company: 'RetailX India Pvt Ltd',
    contactName: 'Vikram Shah',
    email: 'vikram@retailx.in',
    phone: '+91 98765 43210',
    source: 'linkedin',
    status: 'qualified',
    priority: 'high',
    budget: 1500000,
    assignedTo: bde._id,
    nextFollowUp: new Date(Date.now() + 2 * 86400000),
    notes: 'Very interested in a full e-commerce solution with mobile apps.',
  });

  const lead2 = await Lead.create({
    title: 'Legacy System Migration',
    company: 'ManuTech Pvt Ltd',
    contactName: 'Ananya Krishnan',
    email: 'ananya@manutech.in',
    source: 'referral',
    status: 'contacted',
    priority: 'medium',
    budget: 800000,
    assignedTo: bde._id,
    nextFollowUp: new Date(Date.now() + 86400000),
  });

  const account1 = await Account.create({
    name: 'RetailX India Pvt Ltd',
    industry: 'E-commerce & Retail',
    website: 'https://retailx.in',
    email: 'contact@retailx.in',
    phone: '+91 44 4567 8901',
    tier: 'active',
    convertedFrom: lead1._id,
    assignedTo: bde._id,
    address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  });

  const account2 = await Account.create({
    name: 'FinServe Technologies',
    industry: 'Financial Services',
    website: 'https://finserve.in',
    email: 'hello@finserve.in',
    tier: 'active',
    assignedTo: bde._id,
    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  });

  lead1.convertedToAccount = account1._id;
  lead1.status = 'converted';
  await lead1.save();

  const contact1 = await Contact.create({
    account: account1._id, name: 'Vikram Shah', email: 'vikram@retailx.in',
    phone: '+91 98765 43210', designation: 'CTO', isPrimary: true,
  });

  const opp1 = await Opportunity.create({
    title: 'RetailX Full E-commerce Suite',
    account: account1._id,
    contact: contact1._id,
    stage: 'proposal',
    value: 1500000,
    currency: 'INR',
    probability: 40,
    expectedCloseDate: new Date(Date.now() + 30 * 86400000),
    assignedTo: bde._id,
    serviceType: 'new_development',
    description: 'Full e-commerce platform with mobile apps for iOS and Android.',
    nextStep: 'Send detailed proposal document',
  });

  const opp2 = await Opportunity.create({
    title: 'FinServe Mobile App',
    account: account2._id,
    stage: 'negotiation',
    value: 950000,
    currency: 'INR',
    probability: 65,
    expectedCloseDate: new Date(Date.now() + 15 * 86400000),
    assignedTo: bde._id,
    serviceType: 'new_development',
  });

  const project1 = await Project.create({
    title: 'RetailX E-commerce Platform',
    account: account1._id,
    opportunity: opp1._id,
    type: 'new_development',
    status: 'active',
    priority: 'high',
    budget: 1500000,
    currency: 'INR',
    startDate: new Date(),
    endDate: new Date(Date.now() + 120 * 86400000),
    description: 'Full-stack e-commerce platform with React frontend, Node.js backend, and React Native mobile apps.',
    techStack: ['React', 'Node.js', 'MongoDB', 'React Native', 'AWS'],
    team: [
      { user: pm._id, role: 'Project Manager' },
      { user: dev._id, role: 'Lead Developer' },
      { user: tester._id, role: 'QA Engineer' },
    ],
    environments: [
      { name: 'dev', url: 'https://dev.retailx-portal.trikara.dev', isActive: true },
      { name: 'staging', url: 'https://staging.retailx-portal.trikara.dev', isActive: true },
      { name: 'production', url: 'https://retailx.in', isActive: false },
    ],
    services: [
      { name: 'backend', description: 'REST API', techStack: ['Node.js', 'Express', 'MongoDB'] },
      { name: 'frontend', description: 'Web App', techStack: ['React', 'Vite'] },
      { name: 'android', description: 'Android App', techStack: ['React Native'] },
      { name: 'ios', description: 'iOS App', techStack: ['React Native'] },
    ],
    color: '#6366f1',
  });

  await Task.create([
    { title: 'Design database schema for product catalog', project: project1._id, type: 'development', assignedTo: [dev._id], createdBy: pm._id, status: 'done', priority: 'high' },
    { title: 'Implement user authentication module', project: project1._id, type: 'development', assignedTo: [dev._id], createdBy: pm._id, status: 'in_progress', priority: 'high' },
    { title: 'Write test cases for auth module', project: project1._id, type: 'testing', assignedTo: [tester._id], createdBy: pm._id, status: 'todo', priority: 'high' },
    { title: 'Set up CI/CD pipeline on AWS', project: project1._id, type: 'development', assignedTo: [dev._id], createdBy: pm._id, status: 'todo', priority: 'medium' },
    { title: 'Send Q1 proposal to RetailX', type: 'bde', assignedTo: [bde._id], createdBy: superadmin._id, status: 'in_progress', priority: 'high' },
  ]);

  const invoice1 = await Invoice.create({
    account: account1._id,
    project: project1._id,
    contact: contact1._id,
    dueDate: new Date(Date.now() + 30 * 86400000),
    lineItems: [
      { description: 'Advance payment — RetailX E-commerce Platform (Phase 1)', quantity: 1, unitPrice: 500000, amount: 500000 },
    ],
    taxRate: 18,
    notes: 'Thank you for choosing Trikara. Payment due within 30 days.',
    paymentTerms: 'Net 30',
    createdBy: accounting._id,
    status: 'sent',
    sentAt: new Date(),
  });
}

// If run directly from CLI
if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].endsWith('seed'))) {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    await runSeed();
    console.log('\n✅ Seed complete!\n');
    console.log('Login credentials:');
    console.log('  Superadmin : admin@trikara.dev / Admin@123');
    console.log('  PM         : priya@trikara.dev / Test@123');
    console.log('  Developer  : karthik@trikara.dev / Test@123');
    console.log('  Tester     : sneha@trikara.dev / Test@123');
    console.log('  BDE        : rahul@trikara.dev / Test@123');
    console.log('  Accounting : lakshmi@trikara.dev / Test@123');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}
