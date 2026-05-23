import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Course from './models/Course.js';

async function publishAll() {
    await mongoose.connect(process.env.MONGODB_URI);

    const result = await Course.updateMany({ isPublished: false }, { isPublished: true });
    console.log(`✅ ${result.modifiedCount} cours publiés`);

    const all = await Course.find({}, 'title isPublished lessons');
    console.log('\n📋 Tous les cours :');
    all.forEach((c) =>
        console.log(`  - "${c.title}" | publié: ${c.isPublished} | ${c.lessons.length} leçon(s)`)
    );

    await mongoose.disconnect();
}

publishAll().catch(console.error);
