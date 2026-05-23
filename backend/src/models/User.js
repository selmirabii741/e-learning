import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student', index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    speciality: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    provider: { type: String, enum: ['local', 'google', 'github', 'apple', 'keycloak'], default: 'local' },
    providerId: { type: String, default: '' },
    keycloakId: { type: String, default: '', index: true },
    preferences: {
      language: { type: String, enum: ['fr', 'en'], default: 'fr' },
      notifications: {
        email: { type: Boolean, default: true },
        courseUpdates: { type: Boolean, default: true },
        newLessons: { type: Boolean, default: true },
        reminders: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
