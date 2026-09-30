import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { WorkspaceSummary } from '@/lib/workspaceSummary';
import ControlSummary from './ControlSummary';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const missing: WorkspaceSummary = { available: false, observedAt: null, counts: null, statuses: { snapshot: 'unavailable', runtime: 'not_observed', deployment: 'not_observed' } };
const measured: WorkspaceSummary = { available: true, observedAt: '2026-09-30T12:00:00.000Z', counts: { capabilities: 0, tools: 0, systems: 0, repositories: 0, sourceFiles: 0, testFiles: 0, mappedCapabilities: 0, ambiguousCapabilities: 0, unmappedCapabilities: 0 }, statuses: { snapshot: 'recent', runtime: 'not_observed', deployment: 'not_observed' } };
function respond(summary: WorkspaceSummary) { global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ summary }) })) as unknown as typeof fetch; }
function metric(label: string) { return screen.getByText(label).closest('article')!; }

it('keeps preview disconnected and unavailable rather than inventing zero counts', () => {
  global.fetch = jest.fn();
  render(<ControlSummary preview reportMode />);
  expect(screen.getByRole('status')).toHaveTextContent('Preview — no source report connected.');
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Export report' })).toBeDisabled();
  expect(within(metric('Registered capabilities')).getByText('—')).toBeInTheDocument();
  expect(screen.getAllByText('Unknown')).toHaveLength(3);
  expect(fetch).not.toHaveBeenCalled();
});

it.each([401, 403, 503])('handles HTTP %i without stale numbers or error payload leakage', async status => {
  const json = jest.fn();
  global.fetch = jest.fn(async () => ({ ok: false, status, json })) as unknown as typeof fetch;
  render(<ControlSummary />);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(status === 503 ? 'report source is unavailable' : 'session cannot read this report'));
  expect(within(metric('Registered capabilities')).getByText('—')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Export report' })).toBeDisabled();
  expect(json).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('distinguishes an unavailable source from a measured zero and keeps business metrics unknown', async () => {
  respond(missing);
  render(<ControlSummary reportMode />);
  await screen.findByText('No permitted source snapshot is connected.');
  expect(within(metric('Registered capabilities')).getByText('—')).toBeInTheDocument();
  expect(screen.queryByLabelText('Capability mapping counts')).not.toBeInTheDocument();
  respond(measured);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(within(metric('Registered capabilities')).getByText('0')).toBeInTheDocument());
  expect(screen.getByLabelText('Capability mapping counts')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Export report' })).toBeEnabled();
  expect(screen.getAllByText('Not observed by this report')).toHaveLength(2);
  expect(screen.getByText('Not connected')).toBeInTheDocument();
});

it('shows stale source provenance without treating it as live health', async () => {
  respond({ ...measured, statuses: { ...measured.statuses, snapshot: 'stale' } });
  render(<ControlSummary />);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Stale source snapshot'));
  expect(screen.getByText('stale')).toBeInTheDocument();
  expect(screen.getAllByText('Not observed by this report')).toHaveLength(2);
});

it('deduplicates refresh while a read is pending and aborts when unmounted', async () => {
  let finish!: (value: unknown) => void;
  let signal: AbortSignal | undefined;
  global.fetch = jest.fn((_url: RequestInfo | URL, init?: RequestInit) => { signal = init?.signal as AbortSignal; return new Promise<unknown>(resolve => { finish = resolve; }); }) as unknown as typeof fetch;
  const { unmount } = render(<ControlSummary />);
  const button = screen.getByRole('button', { name: 'Reading…' });
  fireEvent.click(button); fireEvent.click(button);
  expect(fetch).toHaveBeenCalledTimes(1);
  unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => { finish({ ok: true, status: 200, json: async () => ({ summary: measured }) }); });
});

it('rejects incomplete successful summary data before rendering or export', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ summary: { available: true, observedAt: null, counts: null, statuses: {} } }) })) as unknown as typeof fetch;
  render(<ControlSummary reportMode />);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Report format unavailable'));
  expect(screen.getByRole('button', { name: 'Export report' })).toBeDisabled();
});
