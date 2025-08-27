import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Actor user is required']
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'create', 'update', 'delete',
        'assign_patient', 'reassign_patient',
        'submit_plan', 'approve_plan', 'revise_plan',
        'log_session', 'submit_report', 'review_report',
        'rate_therapist', 'change_role',
        'export_data', 'import_data'
      ]
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: [
        'User', 'Patient', 'Assignment', 'TherapyPlan',
        'Session', 'ProgressReport', 'ClinicalRating'
      ]
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required']
    },
    meta: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
      reason: String,
      ipAddress: String,
      userAgent: String
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  { 
    timestamps: true,
    collection: 'audit_logs'
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ actorUser: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

// Static method to log actions
AuditLogSchema.statics.logAction = async function(actorUserId, action, entityType, entityId, meta = {}) {
  try {
    await this.create({
      actorUser: actorUserId,
      action,
      entityType,
      entityId,
      meta
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging should not break the main operation
  }
};

export default mongoose.model("AuditLog", AuditLogSchema);
