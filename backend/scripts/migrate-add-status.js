/**
 * One-time migration: set status='approved' on all existing users.
 * Run with: node backend/scripts/migrate-add-status.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning';

async function migrate() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Set status='approved' on all users that don't have a status field
  const result = await users.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'approved' } }
  );

  console.log(`✅ Updated ${result.modifiedCount} users (set status='approved')`);

  // Also set status for any users where it's null
  const result2 = await users.updateMany(
    { status: null },
    { $set: { status: 'approved' } }
  );

  console.log(`✅ Updated ${result2.modifiedCount} additional users (null → 'approved')`);

  await mongoose.disconnect();
  console.log('\n🎉 Migration complete!');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
