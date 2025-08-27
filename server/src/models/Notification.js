import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Recipient user is required']
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'plan_submitted',
        'plan_approved',
        'plan_needs_revision',
        'session_reminder',
        'report_due',
        'report_submitted',
        'assignment_changed',
        'rating_received',
        'system_alert'
      ]
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    payload: {
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId,
      data: mongoose.Schema.Types.Mixed
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    actionUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\/[a-zA-Z0-9\-_\/]*$/.test(v);
        },
        message: 'Invalid action URL format'
      }
    },
    expiresAt: {
      type: Date
    }
  },
  { 
    timestamps: true,
    collection: 'notifications'
  }
);

// Indexes for efficient querying
NotificationSchema.index({ toUser: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is unread
NotificationSchema.virtual('isUnread').get(function() {
  return !this.read;
});

// Instance method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = await this.create(data);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ toUser: userId, read: false });
};

export default mongoose.model("Notification", NotificationSchema);
