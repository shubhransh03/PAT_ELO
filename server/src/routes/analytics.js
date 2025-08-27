import { Router } from "express";
import analyticsService from "../services/analyticsService.js";
import { verifyAuth } from "../middleware/verifyAuth.js";

const router = Router();
router.use(verifyAuth);

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics data
 */
router.get("/dashboard", async (req, res) => {
  try {
    const data = await analyticsService.getDashboardData(
      req.auth.userId, 
      req.auth.role
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for caseload analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getCaseloadDistribution(filters);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Caseload distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch caseload distribution'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for progress analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getProgressRates(filters);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Progress rates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress rates'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for plan approval analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getPlanApprovalAnalytics(filters);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Plan approval analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan approval analytics'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for performance analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getTherapistPerformance(filters);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Therapist performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch therapist performance'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for session analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getSessionAnalytics(filters);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Session analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session analytics'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for ratings analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getRatingsTrends(filters);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Ratings trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ratings trends'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for overdue analytics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await analyticsService.getOverdueAnalytics(filters);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Overdue analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue analytics'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for data export'
      });
    }

    const { type } = req.params;
    const { startDate, endDate } = req.query;
    
    const validTypes = ['caseload', 'progress', 'performance'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export type. Valid types: ' + validTypes.join(', ')
      });
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
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
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
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for analytics summary'
      });
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

    res.json({
      success: true,
      data: {
        caseload: caseloadData,
        progress: progressData,
        planApproval: planApprovalData,
        performance: performanceData,
        sessions: sessionData,
        ratings: ratingsData,
        overdue: overdueData,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics summary'
    });
  }
});

export default router;
