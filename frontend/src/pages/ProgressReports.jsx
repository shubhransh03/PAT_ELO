import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { apiGet, apiPost } from '../api';
import ProgressReportTable from '../components/ProgressReportTable';

const ProgressReports = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'therapist';
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const queryClient = useQueryClient();

  // Fetch progress reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['progress-reports'],
    queryFn: () => apiGet('/api/progress-reports'),
  });

  // Fetch patients with 10+ sessions for report eligibility
  const { data: eligiblePatients } = useQuery({
    queryKey: ['patients', 'eligible-reports'],
    queryFn: () => apiGet('/api/patients', { sessionCount: 10 }),
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: (reportData) => apiPost('/api/progress-reports', reportData),
    onSuccess: () => {
      queryClient.invalidateQueries(['progress-reports']);
      setShowReportForm(false);
      alert('Progress report submitted successfully!');
    },
  });

  // Review report mutation
  const reviewReportMutation = useMutation({
    mutationFn: ({ reportId, feedback }) => 
      apiPost(`/api/progress-reports/${reportId}/review`, { feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries(['progress-reports']);
      setSelectedReport(null);
      setFeedback('');
      alert('Report review completed!');
    },
  });

  const handleSubmitReport = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const reportData = {
      patient: formData.get('patient'),
      sessionCount: Number(formData.get('sessionCount')),
      metricsSummary: [
        {
          metric: formData.get('metric1_name'),
          trend: formData.get('metric1_trend'),
          value: Number(formData.get('metric1_value')),
        }
      ],
      narrative: formData.get('narrative'),
      recommendation: formData.get('recommendation'),
    };
    submitReportMutation.mutate(reportData);
  };

  if (isLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading progress reports...</div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Progress Reports</h1>
        <div className="header-actions">
          {userRole === 'therapist' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowReportForm(!showReportForm)}
            >
              {showReportForm ? 'Cancel' : 'Create Report'}
            </button>
          )}
        </div>
      </div>

      {/* Reminder card for overdue reports */}
      <div className="form-section" style={{ background: 'var(--color-warning-light)' }}>
        <h3 style={{ color: '#92400e' }}>📝 Report Reminders</h3>
        <p style={{ color: '#92400e' }}>
          The following patients have completed 10+ sessions and are due for progress reports:
        </p>
        <ul style={{ color: '#92400e' }}>
          {eligiblePatients?.data?.slice(0, 3).map(patient => (
            <li key={patient._id}>
              {patient.name} - {patient.sessionCount || 0} sessions completed
            </li>
          )) || <li>No patients currently due for reports</li>}
        </ul>
      </div>

      {showReportForm && (
        <div className="form-section">
          <h3>Create Progress Report</h3>
          <form onSubmit={handleSubmitReport}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Patient:</label>
                <select name="patient" className="form-control" required>
                  <option value="">Select patient...</option>
                  {eligiblePatients?.data?.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} ({patient.sessionCount || 0} sessions)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Session Count:</label>
                <input name="sessionCount" type="number" className="form-control" required />
              </div>
            </div>

            <h4>Metrics Summary</h4>
            <div className="grid grid-3">
              <div className="form-group">
                <label>Metric Name:</label>
                <input name="metric1_name" className="form-control" placeholder="e.g., Mood Scale" required />
              </div>
              <div className="form-group">
                <label>Trend:</label>
                <select name="metric1_trend" className="form-control" required>
                  <option value="">Select trend...</option>
                  <option value="improving">Improving</option>
                  <option value="stable">Stable</option>
                  <option value="declining">Declining</option>
                </select>
              </div>
              <div className="form-group">
                <label>Current Value:</label>
                <input name="metric1_value" type="number" step="0.1" className="form-control" required />
              </div>
            </div>

            <div className="form-group">
              <label>Narrative Summary:</label>
              <textarea 
                name="narrative" 
                className="form-control" 
                rows="4"
                placeholder="Describe the patient's progress, challenges, and achievements..."
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label>Recommendation:</label>
              <textarea 
                name="recommendation" 
                className="form-control" 
                rows="3"
                placeholder="Recommend next steps, changes to treatment plan, etc..."
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-success" disabled={submitReportMutation.isPending}>
              {submitReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}

      <div className="data-table-container">
        {selectedIds.length > 0 && (
          <div className="form-actions" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div><strong>{selectedIds.length}</strong> selected</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const selected = (reports?.data || []).filter((r) => selectedIds.includes(r._id));
                  const rows = selected.map((r) => ({
                    id: r._id,
                    patient: r.patient?.name || 'Unknown',
                    sessions: r.sessionCount,
                    status: r.reviewedAt ? 'Reviewed' : 'Pending Review',
                    submitted: new Date(r.submittedAt).toISOString(),
                  }));
                  if (rows.length === 0) return;
                  const header = Object.keys(rows[0]).join(',');
                  const csv = [header, ...rows.map(v => Object.values(v).map(x => `"${String(x).replaceAll('"', '""')}"`).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `progress_reports_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >Export Selected (CSV)</button>
              <button className="btn btn-sm" onClick={() => setSelectedIds([])}>Clear</button>
            </div>
          </div>
        )}
        {!reports?.data?.length ? (
          <div className="data-table-empty">
            <div className="empty-icon">📑</div>
            <h3>No Progress Reports</h3>
            <p>Create a report to review patient progress.</p>
          </div>
        ) : (
          <ProgressReportTable
            rows={(reports?.data || []).map(r => ({
              id: r._id,
              patient: r.patient?.name || 'Unknown',
              sessions: r.sessionCount,
              reviewed: Boolean(r.reviewedAt),
              submitted: new Date(r.submittedAt).toLocaleDateString(),
            }))}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>

      {selectedReport && (
        <div className="form-section">
          <h3>Review Report for {selectedReport.patient?.name}</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4>Metrics Summary:</h4>
            {selectedReport.metricsSummary?.map((metric, index) => (
              <p key={index}>
                <strong>{metric.metric}:</strong> {metric.trend} (Current: {metric.value})
              </p>
            ))}
          </div>

          <div className="form-group">
            <label>Narrative:</label>
            <div className="empty-state" style={{ textAlign: 'left' }}>
              <p style={{ margin: 0 }}>{selectedReport.narrative}</p>
            </div>
          </div>

          <div className="form-group">
            <label>Recommendation:</label>
            <div className="empty-state" style={{ textAlign: 'left' }}>
              <p style={{ margin: 0 }}>{selectedReport.recommendation}</p>
            </div>
          </div>

          <div className="form-group">
            <label>Supervisor Feedback:</label>
            <textarea 
              className="form-control"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows="3"
              placeholder="Provide feedback on the report..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn btn-success"
              onClick={() => reviewReportMutation.mutate({ 
                reportId: selectedReport._id, 
                feedback 
              })}
              disabled={reviewReportMutation.isPending}
            >
              {reviewReportMutation.isPending ? 'Reviewing...' : 'Complete Review'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedReport(null)}
            >
              Cancel
            </button>
          </div>
  </div>
      )}
    </div>
  );
};

export default ProgressReports;
