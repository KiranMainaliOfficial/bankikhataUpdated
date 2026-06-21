import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: mongoose.Schema.Types.ObjectId,
    message: String,
    metadata: mongoose.Schema.Types.Mixed,
    ip: String
  },
  { timestamps: true }
);

export default mongoose.model('ActivityLog', activityLogSchema);
