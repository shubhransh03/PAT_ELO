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
    queryFn: () => apiGet('/api/dashboard'),
  });

  if (isLoading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error loading dashboard: {error.message}</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!</p>
      
      <div className="grid grid-3" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Active Cases</h3>
          <div style={{ fontSize: '2rem', color: '#3498db', fontWeight: 'bold' }}>
            {dashboardData?.activeCases || 12}
          </div>
          <p>Currently assigned cases</p>
        </div>

        {userRole === 'supervisor' && (
          <div className="card">
            <h3>Pending Reviews</h3>
            <div style={{ fontSize: '2rem', color: '#e67e22', fontWeight: 'bold' }}>
              {dashboardData?.pendingReviews || 5}
            </div>
            <p>Plans awaiting review</p>
          </div>
        )}

        <div className="card">
          <h3>Overdue Reports</h3>
          <div style={{ fontSize: '2rem', color: '#e74c3c', fontWeight: 'bold' }}>
            {dashboardData?.overdueReports || 2}
          </div>
          <p>Reports past due date</p>
        </div>

        <div className="card">
          <h3>This Week's Sessions</h3>
          <div style={{ fontSize: '2rem', color: '#27ae60', fontWeight: 'bold' }}>
            {dashboardData?.weekSessions || 18}
          </div>
          <p>Sessions scheduled</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Recent Activity</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              Plan submitted for Patient #123
              <div style={{ fontSize: '0.8rem', color: '#666' }}>2 hours ago</div>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              Session completed with Patient #456
              <div style={{ fontSize: '0.8rem', color: '#666' }}>4 hours ago</div>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              Progress report submitted
              <div style={{ fontSize: '0.8rem', color: '#666' }}>1 day ago</div>
            </li>
          </ul>
        </div>

        <div className="card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-primary">Log New Session</button>
            <button className="btn btn-secondary">Create Therapy Plan</button>
            {userRole === 'supervisor' && (
              <button className="btn btn-success">Review Pending Plans</button>
            )}
            <button className="btn btn-secondary">Generate Report</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
