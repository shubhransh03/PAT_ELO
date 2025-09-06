import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { apiGet, apiPost, apiPut } from '../api';

const TherapyPlans = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'therapist';
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const queryClient = useQueryClient();

  // Fetch therapy plans based on user role
  const { data: plans, isLoading } = useQuery({
    queryKey: ['therapy-plans'],
    // use therapist=me so backend resolves auth user instead of clerk id mismatch
    queryFn: () => apiGet('/api/plans', userRole === 'therapist' ? { therapist: 'me' } : {}),
  });

  // Fetch patients for creating new plans
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => apiGet('/api/patients', { assigned: true }),
  });

  // Submit plan mutation
  const submitPlanMutation = useMutation({
    mutationFn: (planId) => apiPost(`/api/plans/${planId}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries(['therapy-plans']);
      alert('Plan submitted for review!');
    },
  });

  // Review plan mutation
  const reviewPlanMutation = useMutation({
    mutationFn: ({ planId, decision, comments }) =>
      apiPost(`/api/plans/${planId}/review`, { decision, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries(['therapy-plans']);
      setSelectedPlan(null);
      setReviewComment('');
      alert('Plan review completed!');
    },
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (planData) => apiPost('/api/plans', planData),
    onSuccess: () => {
      queryClient.invalidateQueries(['therapy-plans']);
      setShowCreateForm(false);
      alert('Plan created successfully!');
    },
  });

  // Update (edit) plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => apiPut(`/api/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['therapy-plans']);
      setEditingPlan(null);
      alert('Plan updated.');
    }
  });

  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({ goals: [], activities: [], notes: '' });

  const beginEdit = (plan) => {
    setEditingPlan(plan);
    setEditForm({
      goals: plan.goals?.map(g => ({ ...g })) || [],
      activities: plan.activities?.map(a => ({ ...a })) || [],
      notes: plan.notes || ''
    });
    setSelectedPlan(null); // close review if open
  };

  const updateGoalField = (idx, field, value) => {
    setEditForm(f => {
      const goals = [...f.goals];
      goals[idx] = { ...goals[idx], [field]: value };
      return { ...f, goals };
    });
  };
  const addGoal = () => setEditForm(f => ({ ...f, goals: [...f.goals, { title: '', metric: '', target: 0 }] }));
  const removeGoal = (i) => setEditForm(f => ({ ...f, goals: f.goals.filter((_, idx) => idx !== i) }));

  const updateActivityField = (idx, field, value) => {
    setEditForm(f => {
      const activities = [...f.activities];
      activities[idx] = { ...activities[idx], [field]: value };
      return { ...f, activities };
    });
  };
  const addActivity = () => setEditForm(f => ({ ...f, activities: [...f.activities, { name: '', frequency: '', duration: '' }] }));
  const removeActivity = (i) => setEditForm(f => ({ ...f, activities: f.activities.filter((_, idx) => idx !== i) }));

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    // basic cleanup: remove empty goals/activities
    const data = {
      goals: editForm.goals.filter(g => g.title),
      activities: editForm.activities.filter(a => a.name),
      notes: editForm.notes
    };
    updatePlanMutation.mutate({ id: editingPlan._id, data });
  };

  const handleCreatePlan = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const planData = {
      patient: formData.get('patient'),
      goals: [
        {
          title: formData.get('goal1_title'),
          metric: formData.get('goal1_metric'),
          target: Number(formData.get('goal1_target')),
        }
      ],
      activities: [
        {
          name: formData.get('activity1_name'),
          frequency: formData.get('activity1_frequency'),
          duration: formData.get('activity1_duration'),
        }
      ],
      notes: formData.get('notes'),
    };
    createPlanMutation.mutate(planData);
  };

  if (isLoading) return (
    <div className="page-container" aria-busy="true" aria-label="Loading therapy plans">
      <div className="page-header" style={{opacity: .7}}>
        <div style={{height: 32, width: 260}} className="skeleton" />
        <div style={{height: 16, width: 460, marginTop: 10}} className="skeleton" />
      </div>
      <div className="metrics-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="metric-card" aria-hidden>
            <div className="skeleton" style={{width: '100%', height: 96, borderRadius: 12}} />
          </div>
        ))}
      </div>
      <div className="dashboard-section">
        <div className="skeleton" style={{height: 24, width: 220, marginBottom: 16}} />
        <div className="skeleton" style={{height: 180, width: '100%', borderRadius: 12}} />
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Therapy Plans</h1>
        <div className="header-actions">
          {userRole === 'therapist' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Create New Plan'}
            </button>
          )}
          {['admin', 'supervisor'].includes(userRole) && (
            <>
              <button
                className="btn btn-secondary"
                style={{ marginLeft: '0.5rem' }}
                onClick={async () => {
                  try {
                    const res = await fetch('/api/data/export');
                    if (!res.ok) throw new Error('Export failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'export.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) { alert(e.message); }
                }}
              >Export Data</button>
              <label className="btn" style={{ marginLeft: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const json = JSON.parse(text);
                      const res = await fetch('/api/data/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(json)
                      });
                      if (!res.ok) throw new Error('Import failed');
                      await res.json();
                      alert('Import complete');
                      queryClient.invalidateQueries(['therapy-plans']);
                    } catch (err) {
                      alert(err.message);
                    } finally {
                      e.target.value = '';
                    }
                  }}
                />
                Import Data
              </label>
            </>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="form-section">
          <h3>Create New Therapy Plan</h3>
          <form onSubmit={handleCreatePlan}>
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

            <h4>Goals</h4>
            <div className="form-group">
              <label>Goal Title:</label>
              <input name="goal1_title" className="form-control" required />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Metric:</label>
                <input name="goal1_metric" className="form-control" required />
              </div>
              <div className="form-group">
                <label>Target Value:</label>
                <input name="goal1_target" type="number" className="form-control" required />
              </div>
            </div>

            <h4>Activities</h4>
            <div className="form-group">
              <label>Activity Name:</label>
              <input name="activity1_name" className="form-control" required />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Frequency:</label>
                <select name="activity1_frequency" className="form-control" required>
                  <option value="">Select frequency...</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration:</label>
                <input name="activity1_duration" className="form-control" placeholder="e.g., 30 minutes" required />
              </div>
            </div>

            <div className="form-group">
              <label>Notes:</label>
              <textarea name="notes" className="form-control" rows="3"></textarea>
            </div>

            <button type="submit" className="btn btn-success" disabled={createPlanMutation.isPending}>
              {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
            </button>
          </form>
        </div>
      )}

      <div className="data-table-container">
        {!plans?.data?.length ? (
          <div className="data-table-empty">
            <div className="empty-icon">📄</div>
            <h3>No Therapy Plans</h3>
            <p>Create a plan to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Goals</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.data.map(plan => (
                <tr key={plan._id}>
                  <td>{plan.patient?.name || 'Unknown'}</td>
                  <td>{plan.goals?.length || 0} goals</td>
                  <td>
                    <span className={`status-badge status-${plan.status}`}>
                      {plan.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(plan.createdAt).toLocaleDateString()}</td>
                  <td>
                    {plan.status === 'draft' && userRole === 'therapist' && (
                      <>
                        <button
                          className="btn btn-secondary"
                          style={{ marginRight: '0.5rem' }}
                          onClick={() => beginEdit(plan)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => submitPlanMutation.mutate(plan._id)}
                          disabled={submitPlanMutation.isPending}
                        >
                          Submit
                        </button>
                      </>
                    )}
                    {plan.status === 'submitted' && userRole === 'supervisor' && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingPlan && (
        <div className="form-section">
          <h3>Edit Plan for {editingPlan.patient?.name}</h3>
          <form onSubmit={handleEditSubmit}>
            <h4>Goals</h4>
            {editForm.goals.map((g, i) => (
              <div key={i} className="grid grid-3" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  className="form-control"
                  placeholder="Title"
                  value={g.title}
                  onChange={e => updateGoalField(i, 'title', e.target.value)}
                  required
                />
                <input
                  className="form-control"
                  placeholder="Metric"
                  value={g.metric}
                  onChange={e => updateGoalField(i, 'metric', e.target.value)}
                />
                <input
                  className="form-control"
                  type="number"
                  placeholder="Target"
                  value={g.target}
                  onChange={e => updateGoalField(i, 'target', Number(e.target.value))}
                />
                <button type="button" className="btn btn-danger" onClick={() => removeGoal(i)}>X</button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addGoal} style={{ marginBottom: '1rem' }}>+ Goal</button>

            <h4>Activities</h4>
            {editForm.activities.map((a, i) => (
              <div key={i} className="grid grid-3" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  className="form-control"
                  placeholder="Name"
                  value={a.name}
                  onChange={e => updateActivityField(i, 'name', e.target.value)}
                  required
                />
                <input
                  className="form-control"
                  placeholder="Frequency"
                  value={a.frequency}
                  onChange={e => updateActivityField(i, 'frequency', e.target.value)}
                />
                <input
                  className="form-control"
                  placeholder="Duration"
                  value={a.duration}
                  onChange={e => updateActivityField(i, 'duration', e.target.value)}
                />
                <button type="button" className="btn btn-danger" onClick={() => removeActivity(i)}>X</button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addActivity} style={{ marginBottom: '1rem' }}>+ Activity</button>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="form-control"
                rows="3"
                value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success" disabled={updatePlanMutation.isPending}>
                {updatePlanMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingPlan(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selectedPlan && (
        <div className="form-section">
          <h3>Review Plan for {selectedPlan.patient?.name}</h3>
          <div style={{ marginBottom: '1rem' }}>
            <h4>Goals:</h4>
            {selectedPlan.goals?.map((goal, index) => (
              <p key={index}>{goal.title} - Target: {goal.target} {goal.metric}</p>
            ))}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <h4>Activities:</h4>
            {selectedPlan.activities?.map((activity, index) => (
              <p key={index}>{activity.name} - {activity.frequency}, {activity.duration}</p>
            ))}
          </div>
          {selectedPlan.notes && (
            <div style={{ marginBottom: '1rem' }}>
              <h4>Notes:</h4>
              <p>{selectedPlan.notes}</p>
            </div>
          )}
          <div className="form-group">
            <label>Comments:</label>
            <textarea
              className="form-control"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows="3"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-success"
              onClick={() => reviewPlanMutation.mutate({
                planId: selectedPlan._id,
                decision: 'approved',
                comments: reviewComment
              })}
              disabled={reviewPlanMutation.isPending}
            >
              Approve
            </button>
            <button
              className="btn btn-danger"
              onClick={() => reviewPlanMutation.mutate({
                planId: selectedPlan._id,
                decision: 'needs_revision',
                comments: reviewComment
              })}
              disabled={reviewPlanMutation.isPending}
            >
              Request Revision
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedPlan(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapyPlans;
