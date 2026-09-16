import { act, fireEvent, render, screen } from '@testing-library/react';
import Observatory from './Observatory';
import { observatoryPreview } from '@/lib/observatoryPreview';
jest.mock('./ArchitectureGraph', () => ({ __esModule: true, default: () => <div>Graph canvas</div> }));
beforeEach(() => window.history.replaceState(null, '', '/'));
it('shows truthful source counts, unknown runtime health, and local chat controls', () => {
  const originalFetch = global.fetch;
  const fetch = jest.fn(() => { throw new Error('No network allowed'); });
  global.fetch = fetch;
  render(<Observatory initialReport={observatoryPreview()} preview />);
  expect(screen.getByText(/Synthetic design sandbox/)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Delta' })).toHaveAttribute('src', '/delta-logo.svg');
  expect(screen.queryByLabelText('Report command')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ask Delta' }));
  fireEvent.click(screen.getByRole('button', { name: 'Show census for 7 days' }));
  expect(screen.getByRole('combobox', { name: 'History timeframe' })).toHaveValue('7');
  fireEvent.change(screen.getByLabelText('Report command'), { target: { value: 'execute deploy' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send command' }));
  expect(screen.getByText('This panel cannot execute operations or change authority.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh report' })).toBeDisabled();
  expect(fetch).not.toHaveBeenCalled(); global.fetch = originalFetch;
});
it('navigates the directory, inspector and settings without dead controls', () => {
  render(<Observatory initialReport={observatoryPreview()} preview />);
  fireEvent.click(screen.getByRole('button', { name: /delta-backend/ }));
  expect(window.location.hash).toBe('#architecture');
  expect(screen.getByLabelText('Repository filter')).toHaveValue('backend');
  fireEvent.click(screen.getByRole('link', { name: 'Settings' }));
  expect(screen.getByRole('heading', { name: 'Workspace settings' })).toBeInTheDocument();
  expect(screen.getByText('Not activated')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Overview' }));
  expect(screen.getByRole('heading', { name: 'System directory' })).toBeInTheDocument();
});
it('does not invent data when a report is absent', () => {
  render(<Observatory initialReport={null} />);
  expect(screen.getByText('No verified report available')).toBeInTheDocument();
  expect(screen.queryByLabelText('Source census')).not.toBeInTheDocument();
});
it('deduplicates refreshes and clears report content after authorization is revoked', async () => {
  const originalFetch = global.fetch;
  let finish!: (value: unknown) => void;
  const fetch = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  global.fetch = fetch as typeof global.fetch;
  try {
    render(<Observatory initialReport={{ ...observatoryPreview(), synthetic: false }} />);
    const refresh = screen.getByRole('button', { name: 'Refresh report' });
    fireEvent.click(refresh); fireEvent.click(refresh);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(refresh).toBeDisabled();
    await act(async () => { finish({ ok: false, status: 403 }); });
    expect(screen.getByText('No verified report available')).toBeInTheDocument();
    expect(screen.queryByLabelText('Source census')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally { global.fetch = originalFetch; }
});
