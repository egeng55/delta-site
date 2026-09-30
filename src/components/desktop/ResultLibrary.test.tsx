import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResultLibrary from './ResultLibrary';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const task = (index: number, state = 'completed') => ({ id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, input: `Retained outcome ${String(index).padStart(2, '0')}`, kind: 'audit', state, updated_at: '2026-09-30T12:00:00.000Z' });
function respond(tasks: unknown[]) { global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ tasks }) })) as unknown as typeof fetch; }

it('does not request owner task history without an enabled runtime', () => {
  global.fetch = jest.fn();
  render(<ResultLibrary enabled={false} />);
  expect(screen.getByText('Your work will live here.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  expect(fetch).not.toHaveBeenCalled();
});

it('shows loading, then a distinct empty state when only active tasks exist', async () => {
  let finish!: (value: unknown) => void;
  global.fetch = jest.fn(() => new Promise(resolve => { finish = resolve; })) as unknown as typeof fetch;
  render(<ResultLibrary enabled />);
  expect(screen.getByRole('status')).toHaveTextContent('Reading retained results');
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  await act(async () => { finish({ ok: true, status: 200, json: async () => ({ tasks: [task(1, 'running'), task(2, 'waiting_for_approval')] }) }); });
  expect(screen.getByText('Nothing finished here yet.')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Open task evidence' })).not.toBeInTheDocument();
});

it.each([403, 503])('shows an HTTP %i failure as unavailable, then supports explicit refresh', async status => {
  global.fetch = jest.fn(async () => ({ ok: false, status })) as unknown as typeof fetch;
  render(<ResultLibrary enabled />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Results are temporarily unavailable.');
  respond([]);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByText('Nothing finished here yet.');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('filters terminal outcomes, paginates, and resets the page when searching', async () => {
  respond([...Array.from({ length: 10 }, (_, index) => task(index + 1, index === 9 ? 'failed' : 'completed')), task(11, 'running')]);
  render(<ResultLibrary enabled />);
  await screen.findByText('Retained outcome 01');
  expect(screen.getAllByRole('link', { name: 'Open task evidence' })).toHaveLength(8);
  expect(screen.getByText('Page 1 of 2 · 10 retained results')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getAllByRole('link', { name: 'Open task evidence' })[0]).toHaveAttribute('href', `/workspace?task=${task(1).id}#work`);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Retained outcome 09')).toBeInTheDocument();
  expect(screen.getByText('Retained outcome 10')).toBeInTheDocument();
  expect(screen.queryByText('Retained outcome 11')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search results' }), { target: { value: 'failed' } });
  expect(screen.getByText('Page 1 of 1 · 1 retained results')).toBeInTheDocument();
  expect(screen.getByText('Retained outcome 10')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search results' }), { target: { value: 'nonexistent' } });
  expect(screen.getByText('No results match your search.')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('retains budget stops, interrupted work and uncertain outcomes without calling them successful', async () => {
  const states = ['request_budget_exhausted', 'token_budget_exhausted', 'interrupted', 'expired', 'human_review_required', 'blocked', 'unknown'];
  respond([...states.map((state, index) => task(index + 1, state)), task(20, 'queued'), task(21, 'running'), task(22, 'waiting_for_approval')]);
  render(<ResultLibrary enabled />);
  await screen.findByText('request budget exhausted');
  for (const state of states) expect(screen.getByText(state.replaceAll('_', ' '))).toBeInTheDocument();
  expect(screen.queryByText('Retained outcome 20')).not.toBeInTheDocument();
  expect(screen.queryByText('Retained outcome 21')).not.toBeInTheDocument();
  expect(screen.queryByText('Retained outcome 22')).not.toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Open task evidence' })).toHaveLength(states.length);
  expect(screen.queryByText('completed')).not.toBeInTheDocument();
});

it('discards malformed payloads rather than rendering an unsafe evidence URL', async () => {
  respond([{ ...task(1), id: '../../other-user' }]);
  render(<ResultLibrary enabled />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Results are temporarily unavailable');
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it('aborts an in-flight request and removes task display when access is disabled', async () => {
  let signal: AbortSignal | undefined;
  global.fetch = jest.fn((_url, init) => { signal = init?.signal as AbortSignal; return new Promise(() => {}); }) as typeof fetch;
  const { rerender, unmount } = render(<ResultLibrary enabled />);
  rerender(<ResultLibrary enabled={false} />);
  await waitFor(() => expect(signal?.aborted).toBe(true));
  expect(screen.getByText('Your work will live here.')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  unmount();
});
