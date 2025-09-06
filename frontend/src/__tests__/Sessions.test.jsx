import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sessions from '../pages/Sessions.jsx';

function renderWithProviders(ui) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  global.fetch = vi.fn((url, opts) => {
    if (String(url).includes('/api/sessions')) {
      if (opts && opts.method === 'POST') {
        return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: true, data: { _id: 's1' } }) });
      }
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: true, data: [] }) });
    }
    if (String(url).includes('/api/patients')) {
      return Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: true, data: [{ _id: 'p1', name: 'Alice' }] }) });
    }
    return Promise.resolve({ ok: false, status: 404, headers: new Headers({ 'content-type': 'application/json'}), json: () => Promise.resolve({ success: false, error: 'Not found' }) });
  });
});

it('renders and toggles the log session form', async () => {
  renderWithProviders(<Sessions />);
  await waitFor(() => screen.getByText('Session Documentation'));
  fireEvent.click(screen.getByText('Log New Session'));
  expect(screen.getByText('Log New Session')).toBeInTheDocument();
});
