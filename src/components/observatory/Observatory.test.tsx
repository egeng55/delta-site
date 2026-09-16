import { act, fireEvent, render, screen } from '@testing-library/react';
import Observatory from './Observatory';
import { observatoryPreview } from '@/lib/observatoryPreview';
jest.mock('./ArchitectureGraph', () => ({ __esModule: true, default: () => <div>Graph canvas</div> }));
it('shows truthful source counts, unknown runtime health, and local chat controls', () => {
  const originalFetch = global.fetch;
  const fetch = jest.fn(() => { throw new Error('No network allowed'); });
  global.fetch = fetch;
  render(<Observatory initialReport={observatoryPreview()} preview />);
  expect(screen.getByText(/SYNTHETIC DESIGN PREVIEW/)).toBeInTheDocument();
  expect(screen.getByText('Runtime participation & spending')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show census for 7 days' }));
  expect(screen.getByRole('combobox', { name: 'History timeframe' })).toHaveValue('7');
  fireEvent.change(screen.getByLabelText('Report command'), { target: { value: 'execute deploy' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send command' }));
  expect(screen.getByText('This panel cannot execute operations or change authority.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh report' }));
  expect(fetch).not.toHaveBeenCalled(); global.fetch = originalFetch;
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
