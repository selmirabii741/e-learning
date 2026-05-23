import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function fixAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  
  const admin1 = await users.findOne({ email: 'admin1@eduai.com' });
  console.log('Current admin1:', JSON.stringify(admin1, null, 2));
  
  if (admin1) {
    await users.updateOne(
      { _id: admin1._id },
      { $set: { role: 'admin', status: 'approved' } }
    );
    const updated = await users.findOne({ _id: admin1._id });
    console.log('FIXED => role:', updated.role, ', status:', updated.status);
  } else {
    console.log('admin1 user not found in MongoDB');
  }
  
  await mongoose.disconnect();
}

fixAdmin().catch(e => { console.error(e); process.exit(1); });
