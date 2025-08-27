import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { apiGet } from '../api';

const Dashboard = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'therapist';

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiGet('/api/analytics/dashboard'),
  });

  // Fetch notifications count
  const { data: notificationData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => apiGet('/api/notifications/unread-count'),
  });

  if (isLoading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error loading dashboard: {error.message}</div>;

  const {
    activeCases = 0,
    pendingReviews = 0,
    overdueReports = 0,
    recentActivity = []
  } = dashboardData?.data || {};

  const unreadNotifications = notificationData?.count || 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <h3>Active Cases</h3>
            <div className="metric-value">{activeCases}</div>
            <p className="metric-subtitle">Currently assigned</p>
          </div>
        </div>

        {userRole === 'supervisor' && (
          <div className="metric-card">
            <div className="metric-icon">⏳</div>
            <div className="metric-content">
              <h3>Pending Reviews</h3>
              <div className="metric-value pending">{pendingReviews}</div>
              <p className="metric-subtitle">Plans awaiting review</p>
            </div>
          </div>
        )}

        <div className="metric-card">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h3>Overdue Reports</h3>
            <div className="metric-value overdue">{overdueReports}</div>
            <p className="metric-subtitle">Reports past due</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔔</div>
          <div className="metric-content">
            <h3>Notifications</h3>
            <div className="metric-value notification">{unreadNotifications}</div>
            <p className="metric-subtitle">Unread messages</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          {userRole === 'therapist' && (
            <>
              <a href="/sessions" className="action-card">
                <div className="action-icon">📝</div>
                <h3>Log Session</h3>
                <p>Document a therapy session</p>
              </a>
              <a href="/therapy-plans" className="action-card">
                <div className="action-icon">📋</div>
                <h3>Create Plan</h3>
                <p>Create new therapy plan</p>
              </a>
              <a href="/progress-reports" className="action-card">
                <div className="action-icon">📊</div>
                <h3>Submit Report</h3>
                <p>Submit progress report</p>
              </a>
            </>
          )}

          {userRole === 'supervisor' && (
            <>
              <a href="/patient-allocation" className="action-card">
                <div className="action-icon">👥</div>
                <h3>Assign Patients</h3>
                <p>Manage patient allocations</p>
              </a>
              <a href="/therapy-plans" className="action-card">
                <div className="action-icon">✅</div>
                <h3>Review Plans</h3>
                <p>Review submitted plans</p>
              </a>
              <a href="/evaluations" className="action-card">
                <div className="action-icon">⭐</div>
                <h3>Rate Therapists</h3>
                <p>Evaluate therapist performance</p>
              </a>
              <a href="/analytics" className="action-card">
                <div className="action-icon">📈</div>
                <h3>View Analytics</h3>
                <p>Team performance insights</p>
              </a>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <a href="/user-management" className="action-card">
                <div className="action-icon">👤</div>
                <h3>Manage Users</h3>
                <p>Add and manage users</p>
              </a>
              <a href="/analytics" className="action-card">
                <div className="action-icon">📊</div>
                <h3>System Analytics</h3>
                <p>Overall system metrics</p>
              </a>
              <a href="/settings" className="action-card">
                <div className="action-icon">⚙️</div>
                <h3>System Settings</h3>
                <p>Configure system settings</p>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'session' && '💪'}
                  {activity.type === 'plan' && '📋'}
                  {activity.type === 'report' && '📊'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    {activity.type === 'session' && 'Session Logged'}
                    {activity.type === 'plan' && 'Plan Updated'}
                    {activity.type === 'report' && 'Report Submitted'}
                  </div>
                  <div className="activity-subtitle">
                    {activity.data.patient?.name || 'Unknown Patient'} • 
                    {activity.data.therapist?.name || 'Unknown Therapist'}
                  </div>
                  <div className="activity-time">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips & Reminders */}
      <div className="dashboard-section">
        <h2>Tips & Reminders</h2>
        <div className="tips-grid">
          {userRole === 'therapist' && (
            <>
              <div className="tip-card">
                <h4>💡 Documentation Tip</h4>
                <p>Log sessions immediately after completion for better accuracy and compliance.</p>
              </div>
              <div className="tip-card">
                <h4>📅 Progress Reports</h4>
                <p>Progress reports are automatically due after every 10 sessions. Check your notifications!</p>
              </div>
            </>
          )}

          {userRole === 'supervisor' && (
            <>
              <div className="tip-card">
                <h4>⚡ Quick Review</h4>
                <p>Use the bulk review feature to approve multiple similar plans efficiently.</p>
              </div>
              <div className="tip-card">
                <h4>📈 Performance Tracking</h4>
                <p>Regular clinical ratings help identify training opportunities and celebrate successes.</p>
              </div>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <div className="tip-card">
                <h4>🔒 Security</h4>
                <p>Regularly review user access and deactivate accounts for staff who have left.</p>
              </div>
              <div className="tip-card">
                <h4>📊 System Health</h4>
                <p>Monitor system usage patterns to identify peak times and resource needs.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
