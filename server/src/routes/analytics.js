import { Router } from "express";
import analyticsService from "../services/analyticsService.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { ok, fail } from "../middleware/respond.js";

const router = Router();
router.use(verifyAuth);

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics data
 */
/**
 * @openapi
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get("/dashboard", async (req, res) => {
  try {
    // In dev without DB, return a harmless stub so the UI can render
    const skipDb = (process.env.SKIP_DB || '').toLowerCase() === 'true' || process.env.SKIP_DB === '1';
    if (skipDb) {
  return ok(res, { data: { activeCases: 0, pendingReviews: 0, overdueReports: 0, recentActivity: [], userRole: req.auth?.role || 'therapist' } });
    }

    const data = await analyticsService.getDashboardData(
      req.auth.userId, 
      req.auth.role
    );

  return ok(res, { data });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
  return fail(res, 500, 'Failed to fetch dashboard data');
  }
});

/**
 * GET /api/analytics/caseload-distribution
 * Get caseload distribution analytics
 */
router.get("/caseload-distribution", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for caseload analytics');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getCaseloadDistribution(filters);

  return ok(res, { data });
  } catch (error) {
    console.error('Caseload distribution error:', error);
  return fail(res, 500, 'Failed to fetch caseload distribution');
  }
});

/**
 * GET /api/analytics/progress-rates
 * Get progress rates analytics
 */
router.get("/progress-rates", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for progress analytics');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getProgressRates(filters);

  return ok(res, { data });
  } catch (error) {
    console.error('Progress rates error:', error);
  return fail(res, 500, 'Failed to fetch progress rates');
  }
});

/**
 * GET /api/analytics/plan-approval
 * Get therapy plan approval analytics
 */
router.get("/plan-approval", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for plan approval analytics');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getPlanApprovalAnalytics(filters);

  return ok(res, { data });
  } catch (error) {
    console.error('Plan approval analytics error:', error);
  return fail(res, 500, 'Failed to fetch plan approval analytics');
  }
});

/**
 * GET /api/analytics/therapist-performance
 * Get therapist performance analytics
 */
router.get("/therapist-performance", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for performance analytics');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getTherapistPerformance(filters);

  return ok(res, { data });
  } catch (error) {
    console.error('Therapist performance error:', error);
  return fail(res, 500, 'Failed to fetch therapist performance');
  }
});

/**
 * GET /api/analytics/sessions
 * Get session analytics
 */
router.get("/sessions", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for session analytics');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getSessionAnalytics(filters);

  return ok(res, { data });
  } catch (error) {
    console.error('Session analytics error:', error);
  return fail(res, 500, 'Failed to fetch session analytics');
  }
});

/**
 * GET /api/analytics/ratings-trends
 * Get clinical ratings trends
 */
router.get("/ratings-trends", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for ratings analytics');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getRatingsTrends(filters);

  return ok(res, { data });
  } catch (error) {
    console.error('Ratings trends error:', error);
  return fail(res, 500, 'Failed to fetch ratings trends');
  }
});

/**
 * GET /api/analytics/overdue
 * Get overdue items analytics
 */
router.get("/overdue", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for overdue analytics');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getOverdueAnalytics(filters);

  return ok(res, { data });
  } catch (error) {
    console.error('Overdue analytics error:', error);
  return fail(res, 500, 'Failed to fetch overdue analytics');
  }
});

/**
 * GET /api/analytics/export/:type
 * Export analytics data as CSV
 */
router.get("/export/:type", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for data export');
    }

    const { type } = req.params;
    const { startDate, endDate } = req.query;
    
    const validTypes = ['caseload', 'progress', 'performance'];
    if (!validTypes.includes(type)) {
      return fail(res, 400, 'Invalid export type. Valid types: ' + validTypes.join(', '));
    }

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const csvData = await analyticsService.exportAnalytics(type, filters);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    
    res.send(csvData);
  } catch (error) {
    console.error('Export analytics error:', error);
  return fail(res, 500, 'Failed to export analytics data');
  }
});

/**
 * GET /api/analytics/summary
 * Get comprehensive analytics summary
 */
router.get("/summary", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for analytics summary');
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    // Get all analytics data in parallel
    const [
      caseloadData,
      progressData,
      planApprovalData,
      performanceData,
      sessionData,
      ratingsData,
      overdueData
    ] = await Promise.all([
      analyticsService.getCaseloadDistribution(filters),
      analyticsService.getProgressRates(filters),
      analyticsService.getPlanApprovalAnalytics(filters),
      analyticsService.getTherapistPerformance(filters),
      analyticsService.getSessionAnalytics(filters),
      analyticsService.getRatingsTrends(filters),
      analyticsService.getOverdueAnalytics(filters)
    ]);

  return ok(res, { data: { caseload: caseloadData, progress: progressData, planApproval: planApprovalData, performance: performanceData, sessions: sessionData, ratings: ratingsData, overdue: overdueData, generatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('Analytics summary error:', error);
  return fail(res, 500, 'Failed to fetch analytics summary');
  }
});

export default router;
