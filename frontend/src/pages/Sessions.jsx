import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../api';
import SessionTable from '../components/SessionTable';

const Sessions = () => {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiGet('/api/sessions'),
  });

  // Fetch patients for session logging
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => apiGet('/api/patients', { assigned: true }),
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (sessionData) => apiPost('/api/sessions', sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      setShowSessionForm(false);
      alert('Session logged successfully!');
    },
  });

  const handleLogSession = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const sessionData = {
      patient: formData.get('patient'),
      date: formData.get('date'),
      durationMin: Number(formData.get('duration')),
      activities: formData.get('activities').split(',').map(a => a.trim()),
      observations: formData.get('observations'),
      outcomes: [
        {
          metric: formData.get('outcome_metric'),
          value: Number(formData.get('outcome_value')),
        }
      ],
      nextSteps: formData.get('nextSteps'),
    };
    createSessionMutation.mutate(sessionData);
  };

  if (isLoading) return (
    <div className="page-container" aria-busy="true" aria-label="Loading sessions">
      <div className="page-header" style={{opacity: .7}}>
        <div style={{height: 32, width: 240}} className="skeleton" />
        <div style={{height: 16, width: 400, marginTop: 10}} className="skeleton" />
      </div>
      <div className="dashboard-section">
        <div className="skeleton" style={{height: 36, width: 280, marginBottom: 12}} />
        <div className="skeleton" style={{height: 240, width: '100%', borderRadius: 12}} />
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Session Documentation</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowSessionForm(!showSessionForm)}
          >
            {showSessionForm ? 'Cancel' : 'Log New Session'}
          </button>
        </div>
      </div>

      {showSessionForm && (
        <div className="form-section">
          <h3>Log New Session</h3>
          <form onSubmit={handleLogSession}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Patient:</label>
                <select name="patient" className="form-control" required>
                  <option value="">Select patient...</option>
                  {patients?.data?.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input 
                  name="date" 
                  type="datetime-local" 
                  className="form-control" 
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Duration (minutes):</label>
              <input name="duration" type="number" className="form-control" required />
            </div>

            <div className="form-group">
              <label>Activities (comma-separated):</label>
              <input 
                name="activities" 
                className="form-control" 
                placeholder="e.g., Cognitive exercises, Physical therapy, Discussion"
                required 
              />
            </div>

            <div className="form-group">
              <label>Observations:</label>
              <textarea name="observations" className="form-control" rows="3" required></textarea>
            </div>

            <h4>Outcomes</h4>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Metric:</label>
                <input name="outcome_metric" className="form-control" placeholder="e.g., Mood scale" required />
              </div>
              <div className="form-group">
                <label>Value:</label>
                <input name="outcome_value" type="number" step="0.1" className="form-control" required />
              </div>
            </div>

            <div className="form-group">
              <label>Next Steps:</label>
              <textarea name="nextSteps" className="form-control" rows="2" required></textarea>
            </div>

            <button type="submit" className="btn btn-success" disabled={createSessionMutation.isPending}>
              {createSessionMutation.isPending ? 'Logging...' : 'Log Session'}
            </button>
          </form>
        </div>
      )}

      <div className="data-table-container">
        {selectedIds.length > 0 && (
          <div className="form-actions" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <strong>{selectedIds.length}</strong> selected
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const selected = (sessions?.data || []).filter((s) => selectedIds.includes(s._id));
                  const rows = selected.map((s) => ({
                    id: s._id,
                    patient: s.patient?.name || 'Unknown',
                    date: new Date(s.date).toISOString(),
                    durationMin: s.durationMin,
                    activities: Array.isArray(s.activities) ? s.activities.join('; ') : '',
                    outcomes: Array.isArray(s.outcomes) ? s.outcomes.map(o => `${o.metric}:${o.value}`).join('|') : '',
                  }));
                  if (rows.length === 0) return;
                  const header = Object.keys(rows[0]).join(',');
                  const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sessions_export_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export Selected (CSV)
              </button>
              <button className="btn btn-sm" onClick={() => setSelectedIds([])}>Clear</button>
            </div>
          </div>
        )}
        {!sessions?.data?.length ? (
          <div className="data-table-empty">
            <div className="empty-icon">🗓️</div>
            <h3>No Sessions Yet</h3>
            <p>Log your first session to see it here.</p>
          </div>
        ) : (
          <SessionTable
            rows={sessions.data.map((s) => ({
              id: s._id,
              patientName: s.patient?.name || 'Unknown',
              date: new Date(s.date).toLocaleDateString(),
              duration: `${s.durationMin} min`,
              activities: Array.isArray(s.activities) ? s.activities.join(', ') : '',
              outcomes: Array.isArray(s.outcomes)
                ? s.outcomes.map(o => `${o.metric}: ${o.value}`).join(', ')
                : '',
            }))}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>

    <div className="form-section" style={{ marginTop: '2rem' }}>
        <h3>Progress Visualization</h3>
        <div className="form-group">
          <label>Select Patient for Progress Chart:</label>
          <select 
            className="form-control"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">Choose a patient...</option>
            {patients?.data?.map(patient => (
              <option key={patient._id} value={patient._id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
        {selectedPatient && (
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <h3>Progress Chart Placeholder</h3>
            <p>(Chart.js or similar library would render actual progress data)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
