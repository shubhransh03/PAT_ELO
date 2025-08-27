import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Assignment from '../models/Assignment.js';
import TherapyPlan from '../models/TherapyPlan.js';
import Session from '../models/Session.js';
import ProgressReport from '../models/ProgressReport.js';
import ClinicalRating from '../models/ClinicalRating.js';

/**
 * Analytics Service
 * Provides data analytics and reporting for the therapy case management system
 */
class AnalyticsService {

  /**
   * Get dashboard summary data
   * @param {string} userId - User ID for role-based filtering
   * @param {string} userRole - User role
   * @returns {Object} Dashboard metrics
   */
  async getDashboardData(userId, userRole) {
    const baseFilter = this.getBaseFilter(userId, userRole);
    
    try {
      const [
        activeCases,
        pendingReviews,
        overdueReports,
        recentActivity
      ] = await Promise.all([
        this.getActiveCasesCount(baseFilter),
        this.getPendingReviewsCount(baseFilter),
        this.getOverdueReportsCount(baseFilter),
        this.getRecentActivity(baseFilter)
      ]);

      return {
        activeCases,
        pendingReviews,
        overdueReports,
        recentActivity,
        userRole
      };
    } catch (error) {
      console.error('Dashboard data error:', error);
      throw error;
    }
  }

  /**
   * Get caseload distribution analytics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Caseload distribution data
   */
  async getCaseloadDistribution(filters = {}) {
    try {
      const matchFilter = this.buildDateFilter(filters);
      
      const distribution = await Patient.aggregate([
        { $match: { caseStatus: 'active', ...matchFilter } },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTherapist',
            foreignField: '_id',
            as: 'therapist'
          }
        },
        { $unwind: '$therapist' },
        {
          $group: {
            _id: '$therapist._id',
            therapistName: { $first: '$therapist.name' },
            caseCount: { $sum: 1 }
          }
        },
        { $sort: { caseCount: -1 } }
      ]);

      // Calculate statistics
      const caseCounts = distribution.map(d => d.caseCount);
      const stats = {
        total: caseCounts.reduce((sum, count) => sum + count, 0),
        average: caseCounts.length ? caseCounts.reduce((sum, count) => sum + count, 0) / caseCounts.length : 0,
        min: Math.min(...caseCounts) || 0,
        max: Math.max(...caseCounts) || 0
      };

      return {
        distribution,
        stats
      };
    } catch (error) {
      console.error('Caseload distribution error:', error);
      throw error;
    }
  }

  /**
   * Get progress rates analytics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Progress rates data
   */
  async getProgressRates(filters = {}) {
    try {
      const matchFilter = this.buildDateFilter(filters);
      
      const progressData = await ProgressReport.aggregate([
        { $match: matchFilter },
        {
          $lookup: {
            from: 'patients',
            localField: 'patient',
            foreignField: '_id',
            as: 'patientData'
          }
        },
        { $unwind: '$patientData' },
        {
          $group: {
            _id: {
              month: { $month: '$submittedAt' },
              year: { $year: '$submittedAt' }
            },
            totalReports: { $sum: 1 },
            avgProgress: { $avg: '$overallProgress' },
            improvementCount: {
              $sum: {
                $cond: [
                  { $gte: ['$overallProgress', 0.7] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return progressData.map(item => ({
        period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        totalReports: item.totalReports,
        averageProgress: Math.round(item.avgProgress * 100) / 100,
        improvementRate: Math.round((item.improvementCount / item.totalReports) * 100) / 100
      }));
    } catch (error) {
      console.error('Progress rates error:', error);
      throw error;
    }
  }

  /**
   * Get therapy plan approval analytics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Plan approval data
   */
  async getPlanApprovalAnalytics(filters = {}) {
    try {
      const matchFilter = this.buildDateFilter(filters, 'submittedAt');
      
      const approvalData = await TherapyPlan.aggregate([
        { $match: { submittedAt: { $exists: true }, ...matchFilter } },
        {
          $addFields: {
            approvalTime: {
              $cond: [
                { $and: ['$reviewedAt', '$submittedAt'] },
                {
                  $divide: [
                    { $subtract: ['$reviewedAt', '$submittedAt'] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                },
                null
              ]
            }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgApprovalTime: { $avg: '$approvalTime' }
          }
        }
      ]);

      const statusSummary = {};
      approvalData.forEach(item => {
        statusSummary[item._id] = {
          count: item.count,
          avgApprovalTime: item.avgApprovalTime ? Math.round(item.avgApprovalTime * 10) / 10 : null
        };
      });

      return statusSummary;
    } catch (error) {
      console.error('Plan approval analytics error:', error);
      throw error;
    }
  }

  /**
   * Get therapist performance analytics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Performance data
   */
  async getTherapistPerformance(filters = {}) {
    try {
      const matchFilter = this.buildDateFilter(filters);
      
      const performance = await User.aggregate([
        { $match: { role: 'therapist', active: true } },
        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: 'assignedTherapist',
            as: 'patients'
          }
        },
        {
          $lookup: {
            from: 'sessions',
            localField: '_id',
            foreignField: 'therapist',
            as: 'sessions'
          }
        },
        {
          $lookup: {
            from: 'clinicalratings',
            localField: '_id',
            foreignField: 'therapist',
            as: 'ratings'
          }
        },
        {
          $addFields: {
            activeCases: {
              $size: {
                $filter: {
                  input: '$patients',
                  cond: { $eq: ['$$this.caseStatus', 'active'] }
                }
              }
            },
            totalSessions: { $size: '$sessions' },
            averageRating: { $avg: '$ratings.overallScore' }
          }
        },
        {
          $project: {
            name: 1,
            specialties: 1,
            activeCases: 1,
            totalSessions: 1,
            averageRating: { $round: ['$averageRating', 2] }
          }
        },
        { $sort: { averageRating: -1 } }
      ]);

      return performance;
    } catch (error) {
      console.error('Therapist performance error:', error);
      throw error;
    }
  }

  /**
   * Get session analytics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Session data
   */
  async getSessionAnalytics(filters = {}) {
    try {
      const matchFilter = this.buildDateFilter(filters, 'date');
      
      const sessionData = await Session.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalSessions: { $sum: 1 },
            avgDuration: { $avg: '$durationMin' },
            uniquePatients: { $addToSet: '$patient' }
          }
        },
        {
          $addFields: {
            uniquePatientCount: { $size: '$uniquePatients' }
          }
        },
        {
          $project: {
            _id: 1,
            totalSessions: 1,
            avgDuration: { $round: ['$avgDuration', 1] },
            uniquePatientCount: 1
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return sessionData.map(item => ({
        period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        totalSessions: item.totalSessions,
        averageDuration: item.avgDuration,
        uniquePatients: item.uniquePatientCount
      }));
    } catch (error) {
      console.error('Session analytics error:', error);
      throw error;
    }
  }

  /**
   * Get clinical ratings trends
   * @param {Object} filters - Filter criteria
   * @returns {Object} Ratings trend data
   */
  async getRatingsTrends(filters = {}) {
    try {
      const matchFilter = this.buildDateFilter(filters);
      
      const trends = await ClinicalRating.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            avgOverallScore: { $avg: '$overallScore' },
            avgClinicalSkills: { $avg: '$scores.clinicalSkills' },
            avgCommunication: { $avg: '$scores.communication' },
            avgProfessionalism: { $avg: '$scores.professionalism' },
            totalRatings: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return trends.map(item => ({
        period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        overallScore: Math.round(item.avgOverallScore * 100) / 100,
        clinicalSkills: Math.round(item.avgClinicalSkills * 100) / 100,
        communication: Math.round(item.avgCommunication * 100) / 100,
        professionalism: Math.round(item.avgProfessionalism * 100) / 100,
        totalRatings: item.totalRatings
      }));
    } catch (error) {
      console.error('Ratings trends error:', error);
      throw error;
    }
  }

  /**
   * Get overdue items analytics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Overdue items data
   */
  async getOverdueAnalytics(filters = {}) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [overdueReports, overdueReviews] = await Promise.all([
        // Progress reports overdue (after 10 sessions without report)
        Session.aggregate([
          {
            $group: {
              _id: '$patient',
              sessionCount: { $sum: 1 },
              lastSession: { $max: '$date' }
            }
          },
          { $match: { sessionCount: { $gte: 10 } } },
          {
            $lookup: {
              from: 'progressreports',
              let: { patientId: '$_id', lastSessionDate: '$lastSession' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$patient', '$$patientId'] },
                        { $gte: ['$submittedAt', '$$lastSessionDate'] }
                      ]
                    }
                  }
                }
              ],
              as: 'recentReports'
            }
          },
          { $match: { 'recentReports.0': { $exists: false } } },
          {
            $lookup: {
              from: 'patients',
              localField: '_id',
              foreignField: '_id',
              as: 'patient'
            }
          },
          { $unwind: '$patient' },
          {
            $lookup: {
              from: 'users',
              localField: 'patient.assignedTherapist',
              foreignField: '_id',
              as: 'therapist'
            }
          },
          { $unwind: '$therapist' }
        ]),

        // Plans pending review for > 7 days
        TherapyPlan.find({
          status: 'submitted',
          submittedAt: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }).populate(['patient', 'therapist'])
      ]);

      return {
        overdueProgressReports: overdueReports,
        overduePlanReviews: overdueReviews
      };
    } catch (error) {
      console.error('Overdue analytics error:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Get base filter for user role-based queries
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Object} Base filter object
   */
  getBaseFilter(userId, userRole) {
    switch (userRole) {
      case 'therapist':
        return { assignedTherapist: userId };
      case 'supervisor':
        return { supervisor: userId };
      case 'admin':
        return {};
      default:
        return { assignedTherapist: userId };
    }
  }

  /**
   * Build date filter for queries
   * @param {Object} filters - Filter criteria
   * @param {string} dateField - Date field name
   * @returns {Object} Date filter object
   */
  buildDateFilter(filters, dateField = 'createdAt') {
    const dateFilter = {};
    
    if (filters.startDate) {
      dateFilter[dateField] = { $gte: new Date(filters.startDate) };
    }
    
    if (filters.endDate) {
      dateFilter[dateField] = { 
        ...dateFilter[dateField], 
        $lte: new Date(filters.endDate) 
      };
    }

    return dateFilter;
  }

  /**
   * Get active cases count
   * @param {Object} baseFilter - Base filter for user role
   * @returns {number} Active cases count
   */
  async getActiveCasesCount(baseFilter) {
    return Patient.countDocuments({
      caseStatus: 'active',
      ...baseFilter
    });
  }

  /**
   * Get pending reviews count
   * @param {Object} baseFilter - Base filter for user role
   * @returns {number} Pending reviews count
   */
  async getPendingReviewsCount(baseFilter) {
    return TherapyPlan.countDocuments({
      status: 'submitted',
      ...baseFilter
    });
  }

  /**
   * Get overdue reports count
   * @param {Object} baseFilter - Base filter for user role
   * @returns {number} Overdue reports count
   */
  async getOverdueReportsCount(baseFilter) {
    // This is a simplified count - in practice, you'd calculate based on session count
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    return ProgressReport.countDocuments({
      submittedAt: { $lt: overdueDate },
      ...baseFilter
    });
  }

  /**
   * Get recent activity data
   * @param {Object} baseFilter - Base filter for user role
   * @returns {Array} Recent activity items
   */
  async getRecentActivity(baseFilter) {
    // Get recent sessions, plans, and reports
    const [recentSessions, recentPlans, recentReports] = await Promise.all([
      Session.find(baseFilter)
        .populate(['patient', 'therapist'])
        .sort({ date: -1 })
        .limit(5),
      TherapyPlan.find(baseFilter)
        .populate(['patient', 'therapist'])
        .sort({ updatedAt: -1 })
        .limit(5),
      ProgressReport.find(baseFilter)
        .populate(['patient', 'therapist'])
        .sort({ submittedAt: -1 })
        .limit(5)
    ]);

    // Combine and sort by date
    const allActivity = [
      ...recentSessions.map(s => ({ type: 'session', data: s, date: s.date })),
      ...recentPlans.map(p => ({ type: 'plan', data: p, date: p.updatedAt })),
      ...recentReports.map(r => ({ type: 'report', data: r, date: r.submittedAt }))
    ];

    return allActivity
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }

  /**
   * Export analytics data to CSV format
   * @param {string} type - Type of analytics data
   * @param {Object} filters - Filter criteria
   * @returns {string} CSV formatted data
   */
  async exportAnalytics(type, filters = {}) {
    let data;
    let headers;

    switch (type) {
      case 'caseload':
        data = await this.getCaseloadDistribution(filters);
        headers = ['Therapist Name', 'Case Count'];
        return this.formatCSV(data.distribution, headers, ['therapistName', 'caseCount']);

      case 'progress':
        data = await this.getProgressRates(filters);
        headers = ['Period', 'Total Reports', 'Average Progress', 'Improvement Rate'];
        return this.formatCSV(data, headers, ['period', 'totalReports', 'averageProgress', 'improvementRate']);

      case 'performance':
        data = await this.getTherapistPerformance(filters);
        headers = ['Therapist Name', 'Active Cases', 'Total Sessions', 'Average Rating'];
        return this.formatCSV(data, headers, ['name', 'activeCases', 'totalSessions', 'averageRating']);

      default:
        throw new Error('Invalid analytics type for export');
    }
  }

  /**
   * Format data as CSV
   * @param {Array} data - Data to format
   * @param {Array} headers - CSV headers
   * @param {Array} fields - Object fields to extract
   * @returns {string} CSV formatted string
   */
  formatCSV(data, headers, fields) {
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const row = fields.map(field => {
        const value = item[field];
        return typeof value === 'string' ? `"${value}"` : value || '';
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

export default new AnalyticsService();
