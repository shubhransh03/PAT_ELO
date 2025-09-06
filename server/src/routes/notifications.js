import { Router } from "express";
import rateLimit from "express-rate-limit";
import Notification from "../models/Notification.js";
import notificationService from "../services/notificationService.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { ok, created, fail } from "../middleware/respond.js";
import { validateBody } from "../middleware/validate.js";
import { systemAlertSchema } from "../validation/schemas.js";

const router = Router();
router.use(verifyAuth);

// Rate limits
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 400, standardHeaders: true, legacyHeaders: false });

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: List notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Notifications list
 */
router.get("/", readLimiter, async (req, res) => {
  try {
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
    if (skipDb) {
      const { limit = 20, page = 1 } = req.query;
      return ok(res, { data: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 }, unreadCount: 0 });
    }
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

  return ok(res, { data: result.notifications, pagination: result.pagination, unreadCount: result.unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
  return fail(res, 500, 'Failed to fetch notifications');
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get("/unread-count", readLimiter, async (req, res) => {
  try {
    const skipDb = (process.env.SKIP_DB || '').toLowerCase() === 'true' || process.env.SKIP_DB === '1';
    if (skipDb) {
      return ok(res, { count: 0 });
    }
    const count = await Notification.getUnreadCount(req.auth.userId);
    return ok(res, { count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return fail(res, 500, 'Failed to get unread count');
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch("/:id/read", writeLimiter, async (req, res) => {
  try {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
  if (skipDb) return fail(res, 404, 'Notification not found');
    const notification = await notificationService.markAsRead(
      req.params.id, 
      req.auth.userId
    );

    return ok(res, { data: notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    if (error.message.includes('not found')) {
      return fail(res, 404, 'Notification not found');
    }
    return fail(res, 500, 'Failed to mark notification as read');
  }
});

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read for the user
 */
router.patch("/mark-all-read", writeLimiter, async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.auth.userId);
  return ok(res, { data: { modifiedCount: result.modifiedCount } });
  } catch (error) {
    console.error('Mark all as read error:', error);
  return fail(res, 500, 'Failed to mark all notifications as read');
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification (only the recipient can delete)
 */
router.delete("/:id", writeLimiter, async (req, res) => {
  try {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
  if (skipDb) return fail(res, 404, 'Notification not found');
    const notification = await Notification.findOne({
      _id: req.params.id,
      toUser: req.auth.userId
    });

    if (!notification) {
      return fail(res, 404, 'Notification not found');
    }

    await notification.deleteOne();

  return ok(res, { message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
  return fail(res, 500, 'Failed to delete notification');
  }
});

/**
 * POST /api/notifications/system-alert (Admin only)
 * Create a system alert notification
 */
router.post("/system-alert", writeLimiter, validateBody(systemAlertSchema), async (req, res) => {
  try {
    // Check if user is admin
    if (req.auth.role !== 'admin') {
  return fail(res, 403, 'Only administrators can create system alerts');
    }

    const { targetUsers, title, message, priority = 'medium' } = req.body;

    if (!title || !message) {
      return fail(res, 400, 'Title and message are required');
    }

    if (!Array.isArray(targetUsers) || targetUsers.length === 0) {
      return fail(res, 400, 'Target users array is required');
    }

    // Create notifications for each target user
    const notifications = await Promise.all(
      targetUsers.map(userId => 
        notificationService.createSystemAlert(userId, title, message, priority)
      )
    );

  return created(res, { data: notifications.filter(n => n !== null), message: 'System alerts created successfully' });
  } catch (error) {
    console.error('Create system alert error:', error);
  return fail(res, 500, 'Failed to create system alert');
  }
});

/**
 * GET /api/notifications/stats (Admin/Supervisor only)
 * Get notification statistics
 */
router.get("/stats", readLimiter, async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'supervisor'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await notificationService.getNotificationStats(filters);

  return ok(res, { data: stats });
  } catch (error) {
    console.error('Get notification stats error:', error);
  return fail(res, 500, 'Failed to get notification statistics');
  }
});

/**
 * DELETE /api/notifications/cleanup (Admin only)
 * Clean up old read notifications
 */
router.delete("/cleanup", writeLimiter, async (req, res) => {
  try {
    // Check if user is admin
    if (req.auth.role !== 'admin') {
  return fail(res, 403, 'Only administrators can perform cleanup');
    }

    const { daysOld = 90 } = req.query;
    const result = await notificationService.deleteOldNotifications(parseInt(daysOld));

  return ok(res, { data: { deletedCount: result.deletedCount }, message: `Cleaned up notifications older than ${daysOld} days` });
  } catch (error) {
    console.error('Notification cleanup error:', error);
  return fail(res, 500, 'Failed to cleanup old notifications');
  }
});

export default router;
