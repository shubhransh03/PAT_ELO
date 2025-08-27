import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { apiGet, apiPost, apiPatch } from '../api';

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
    queryFn: () => apiGet('/api/plans', userRole === 'therapist' ? { therapist: user.id } : {}),
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
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading therapy plans...</div>
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
                      <button 
                        className="btn btn-primary"
                        onClick={() => submitPlanMutation.mutate(plan._id)}
                        disabled={submitPlanMutation.isPending}
                      >
                        Submit
                      </button>
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
