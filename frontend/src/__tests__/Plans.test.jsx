import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TherapyPlans from '../pages/TherapyPlans.jsx';

function renderWithProviders(ui) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: { publicMetadata: { role: 'therapist' }, emailAddresses: [{ emailAddress: 't@example.com'}] } })
}));

beforeEach(() => {
  // Provide plans and patients lists for initial render
  global.fetch = vi.fn((url, opts) => {
    if (String(url).includes('/api/plans')) {
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: true, data: [] }) });
    }
    if (String(url).includes('/api/patients')) {
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: true, data: [{ _id: 'p1', name: 'Alice' }] }) });
    }
    if (String(url).includes('/api/data/export')) {
      return Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['id'], { type: 'application/json'})) });
    }
    return Promise.resolve({ ok: false, status: 404, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: false, error: 'Not found' }) });
  });
});

it('shows empty state and can open create plan form', async () => {
  renderWithProviders(<TherapyPlans />);
  await waitFor(() => screen.getByText('Therapy Plans'));
  expect(screen.getByText('No Therapy Plans')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Create New Plan'));
  expect(screen.getByText('Create New Therapy Plan')).toBeInTheDocument();
});
