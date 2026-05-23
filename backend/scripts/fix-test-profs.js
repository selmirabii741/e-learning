import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Fix test users that were incorrectly assigned as students
  const result = await db.collection('users').updateMany(
    { email: { $regex: /testprof/ } },
    { $set: { role: 'instructor', status: 'pending' } }
  );
  console.log(`Fixed ${result.modifiedCount} test professor users`);

  const users = await db.collection('users').find({ email: { $regex: /testprof/ } }).toArray();
  users.forEach(u => console.log(`  ${u.name} → role: ${u.role}, status: ${u.status}`));
  
  await mongoose.disconnect();
}

fix().catch(console.error);
