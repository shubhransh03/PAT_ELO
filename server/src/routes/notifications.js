import { Router } from "express";
import Notification from "../models/Notification.js";
import notificationService from "../services/notificationService.js";
import { verifyAuth } from "../middleware/verifyAuth.js";

const router = Router();
router.use(verifyAuth);

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false, 
      type 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type
    };

    const result = await notificationService.getUserNotifications(
      req.auth.userId, 
      options
    );

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get("/unread-count", async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.auth.userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch("/:id/read", async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id, 
      req.auth.userId
    );

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read for the user
 */
router.patch("/mark-all-read", async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.auth.userId);

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification (only the recipient can delete)
 */
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      toUser: req.auth.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

/**
 * POST /api/notifications/system-alert (Admin only)
 * Create a system alert notification
 */
router.post("/system-alert", async (req, res) => {
  try {
    // Check if user is admin
    if (req.auth.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create system alerts'
      });
    }

    const { targetUsers, title, message, priority = 'medium' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    if (!Array.isArray(targetUsers) || targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Target users array is required'
      });
    }

    // Create notifications for each target user
    const notifications = await Promise.all(
      targetUsers.map(userId => 
        notificationService.createSystemAlert(userId, title, message, priority)
      )
    );

    res.status(201).json({
      success: true,
      data: notifications.filter(n => n !== null), // Filter out failed notifications
      message: 'System alerts created successfully'
    });
  } catch (error) {
    console.error('Create system alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create system alert'
    });
  }
});

/**
 * GET /api/notifications/stats (Admin/Supervisor only)
 * Get notification statistics
 */
router.get("/stats", async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'supervisor'].includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await notificationService.getNotificationStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification statistics'
    });
  }
});

/**
 * DELETE /api/notifications/cleanup (Admin only)
 * Clean up old read notifications
 */
router.delete("/cleanup", async (req, res) => {
  try {
    // Check if user is admin
    if (req.auth.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can perform cleanup'
      });
    }

    const { daysOld = 90 } = req.query;
    const result = await notificationService.deleteOldNotifications(parseInt(daysOld));

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `Cleaned up notifications older than ${daysOld} days`
    });
  } catch (error) {
    console.error('Notification cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old notifications'
    });
  }
});

export default router;
