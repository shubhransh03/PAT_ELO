import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/Dashboard.jsx';

function renderWithProviders(ui) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests so error states surface immediately
        retry: 0,
      },
    },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// Mock Clerk hook to avoid real auth in tests
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: { firstName: 'Test', emailAddresses: [{ emailAddress: 't@example.com'}], publicMetadata: { role: 'therapist' } } })
}));

// Mock API fetches for dashboard and notifications
const dashboardPayload = { success: true, data: { activeCases: 2, pendingReviews: 1, overdueReports: 0, recentActivity: [] }};
const unreadPayload = { success: true, count: 3 };

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (String(url).includes('/api/analytics/dashboard')) {
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve(dashboardPayload) });
    }
    if (String(url).includes('/api/notifications/unread-count')) {
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve(unreadPayload) });
    }
    return Promise.resolve({ ok: false, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: false, error: 'Not found' }), status: 404 });
  });
});

it('renders dashboard metrics and notifications count', async () => {
  renderWithProviders(<Dashboard />);
  await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  expect(screen.getByText('Active Cases')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('Notifications')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});

it('shows error state when dashboard fetch fails', async () => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: false, error: 'Server error' }) }));
  renderWithProviders(<Dashboard />);
  await waitFor(() => expect(screen.getByText('Dashboard Error')).toBeInTheDocument());
});
