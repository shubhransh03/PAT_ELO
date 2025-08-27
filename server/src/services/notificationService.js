import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Notification Service
 * Handles creation and management of system notifications
 */
class NotificationService {
  
  /**
   * Create a notification for therapy plan submission
   * @param {string} therapistId - ID of therapist who submitted
   * @param {string} supervisorId - ID of supervisor to notify
   * @param {string} planId - ID of therapy plan
   * @param {string} patientName - Name of patient
   */
  async notifyPlanSubmitted(therapistId, supervisorId, planId, patientName) {
    const therapist = await User.findById(therapistId);
    
    return this.createNotification({
      toUser: supervisorId,
      fromUser: therapistId,
      type: 'plan_submitted',
      title: 'New Therapy Plan Submitted',
      message: `${therapist?.name || 'A therapist'} has submitted a therapy plan for ${patientName}`,
      payload: {
        entityType: 'TherapyPlan',
        entityId: planId,
        data: { patientName, therapistName: therapist?.name }
      },
      priority: 'medium',
      actionUrl: `/therapy-plans/${planId}`
    });
  }

  /**
   * Create a notification for therapy plan approval
   * @param {string} supervisorId - ID of supervisor who approved
   * @param {string} therapistId - ID of therapist to notify
   * @param {string} planId - ID of therapy plan
   * @param {string} patientName - Name of patient
   */
  async notifyPlanApproved(supervisorId, therapistId, planId, patientName) {
    const supervisor = await User.findById(supervisorId);
    
    return this.createNotification({
      toUser: therapistId,
      fromUser: supervisorId,
      type: 'plan_approved',
      title: 'Therapy Plan Approved',
      message: `Your therapy plan for ${patientName} has been approved by ${supervisor?.name || 'your supervisor'}`,
      payload: {
        entityType: 'TherapyPlan',
        entityId: planId,
        data: { patientName, supervisorName: supervisor?.name }
      },
      priority: 'medium',
      actionUrl: `/therapy-plans/${planId}`
    });
  }

  /**
   * Create a notification for therapy plan revision request
   * @param {string} supervisorId - ID of supervisor requesting revision
   * @param {string} therapistId - ID of therapist to notify
   * @param {string} planId - ID of therapy plan
   * @param {string} patientName - Name of patient
   * @param {string} comments - Supervisor comments
   */
  async notifyPlanNeedsRevision(supervisorId, therapistId, planId, patientName, comments) {
    const supervisor = await User.findById(supervisorId);
    
    return this.createNotification({
      toUser: therapistId,
      fromUser: supervisorId,
      type: 'plan_needs_revision',
      title: 'Therapy Plan Needs Revision',
      message: `Your therapy plan for ${patientName} needs revision. Comments: ${comments?.substring(0, 100)}${comments?.length > 100 ? '...' : ''}`,
      payload: {
        entityType: 'TherapyPlan',
        entityId: planId,
        data: { patientName, supervisorName: supervisor?.name, comments }
      },
      priority: 'high',
      actionUrl: `/therapy-plans/${planId}`
    });
  }

  /**
   * Create a notification for progress report due
   * @param {string} therapistId - ID of therapist to notify
   * @param {string} patientId - ID of patient
   * @param {string} patientName - Name of patient
   * @param {number} sessionCount - Current session count
   */
  async notifyProgressReportDue(therapistId, patientId, patientName, sessionCount) {
    return this.createNotification({
      toUser: therapistId,
      type: 'report_due',
      title: 'Progress Report Due',
      message: `Progress report is due for ${patientName} after ${sessionCount} sessions`,
      payload: {
        entityType: 'Patient',
        entityId: patientId,
        data: { patientName, sessionCount }
      },
      priority: 'high',
      actionUrl: `/progress-reports/new?patient=${patientId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  /**
   * Create a notification for progress report submission
   * @param {string} therapistId - ID of therapist who submitted
   * @param {string} supervisorId - ID of supervisor to notify
   * @param {string} reportId - ID of progress report
   * @param {string} patientName - Name of patient
   */
  async notifyProgressReportSubmitted(therapistId, supervisorId, reportId, patientName) {
    const therapist = await User.findById(therapistId);
    
    return this.createNotification({
      toUser: supervisorId,
      fromUser: therapistId,
      type: 'report_submitted',
      title: 'Progress Report Submitted',
      message: `${therapist?.name || 'A therapist'} has submitted a progress report for ${patientName}`,
      payload: {
        entityType: 'ProgressReport',
        entityId: reportId,
        data: { patientName, therapistName: therapist?.name }
      },
      priority: 'medium',
      actionUrl: `/progress-reports/${reportId}`
    });
  }

  /**
   * Create a notification for patient assignment change
   * @param {string} therapistId - ID of therapist to notify
   * @param {string} patientId - ID of patient
   * @param {string} patientName - Name of patient
   * @param {string} action - 'assigned' or 'reassigned'
   */
  async notifyAssignmentChanged(therapistId, patientId, patientName, action = 'assigned') {
    return this.createNotification({
      toUser: therapistId,
      type: 'assignment_changed',
      title: `Patient ${action === 'assigned' ? 'Assigned' : 'Reassigned'}`,
      message: `You have been ${action} to patient: ${patientName}`,
      payload: {
        entityType: 'Patient',
        entityId: patientId,
        data: { patientName, action }
      },
      priority: 'medium',
      actionUrl: `/patients/${patientId}`
    });
  }

  /**
   * Create a notification for clinical rating received
   * @param {string} supervisorId - ID of supervisor who gave rating
   * @param {string} therapistId - ID of therapist to notify
   * @param {string} ratingId - ID of clinical rating
   * @param {number} overallScore - Overall rating score
   */
  async notifyRatingReceived(supervisorId, therapistId, ratingId, overallScore) {
    const supervisor = await User.findById(supervisorId);
    
    return this.createNotification({
      toUser: therapistId,
      fromUser: supervisorId,
      type: 'rating_received',
      title: 'Clinical Rating Received',
      message: `You received a clinical rating (${overallScore}/5) from ${supervisor?.name || 'your supervisor'}`,
      payload: {
        entityType: 'ClinicalRating',
        entityId: ratingId,
        data: { supervisorName: supervisor?.name, overallScore }
      },
      priority: 'medium',
      actionUrl: `/evaluations/${ratingId}`
    });
  }

  /**
   * Create a system alert notification
   * @param {string} userId - ID of user to notify
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   * @param {string} priority - Alert priority
   */
  async createSystemAlert(userId, title, message, priority = 'medium') {
    return this.createNotification({
      toUser: userId,
      type: 'system_alert',
      title,
      message,
      priority,
      payload: {
        entityType: 'System',
        data: { alertType: 'system' }
      }
    });
  }

  /**
   * Create a notification with standard error handling
   * @param {Object} notificationData - Notification data
   * @returns {Object} Created notification
   */
  async createNotification(notificationData) {
    try {
      return await Notification.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't throw - notification failure shouldn't break main operations
      return null;
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Notifications and metadata
   */
  async getUserNotifications(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false,
      type = null 
    } = options;

    const filter = { toUser: userId };
    
    if (unreadOnly) {
      filter.read = false;
    }
    
    if (type) {
      filter.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('fromUser', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.getUnreadCount(userId)
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Updated notification
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      toUser: userId
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    return notification.markAsRead();
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Object} Update result
   */
  async markAllAsRead(userId) {
    return Notification.updateMany(
      { toUser: userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );
  }

  /**
   * Delete old notifications (cleanup job)
   * @param {number} daysOld - Age in days
   * @returns {Object} Delete result
   */
  async deleteOldNotifications(daysOld = 90) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    return Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true
    });
  }

  /**
   * Get notification statistics for admin dashboard
   * @param {Object} filters - Filter criteria
   * @returns {Object} Notification statistics
   */
  async getNotificationStats(filters = {}) {
    const matchFilter = {};
    
    if (filters.startDate) {
      matchFilter.createdAt = { $gte: new Date(filters.startDate) };
    }
    
    if (filters.endDate) {
      matchFilter.createdAt = { 
        ...matchFilter.createdAt, 
        $lte: new Date(filters.endDate) 
      };
    }

    const stats = await Notification.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: { 
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } 
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return stats;
  }
}

export default new NotificationService();
