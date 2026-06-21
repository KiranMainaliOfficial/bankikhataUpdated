import ActivityLog from '../models/ActivityLog.js';

export async function logActivity(req, action, entity, entityId, message, metadata = {}) {
  await ActivityLog.create({
    actor: req.user?._id,
    action,
    entity,
    entityId,
    message,
    metadata,
    ip: req.ip
  });
}
