import mongoose from 'mongoose';

const professorVerificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    certificateData: { type: String },          // base64-encoded file content
    certificateType: { type: String },          // MIME type (application/pdf, image/png, etc.)
    certificateName: { type: String },          // original filename
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    adminComment: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('ProfessorVerification', professorVerificationSchema);
