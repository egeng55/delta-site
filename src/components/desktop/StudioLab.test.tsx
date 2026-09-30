import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StudioLab from './StudioLab';

const originalFetch = global.fetch;
const workspace = { version: 1, observedAt: '2026-09-30T12:00:00.000Z', connection: 'unconfigured', runtime: null };
afterEach(() => { global.fetch = originalFetch; jest.useRealTimers(); });

it.each([{ preview: true, canInspectRuntime: true }, { preview: false, canInspectRuntime: false }])('does not make endpoint calls without live owner access: %o', props => {
  global.fetch = jest.fn();
  render(<StudioLab {...props} />);
  const inspect = screen.getByRole('button', { name: 'Inspect endpoint' });
  expect(inspect).toBeDisabled();
  fireEvent.click(inspect);
  fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));
  expect(screen.getByText('Valid command is retained')).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('runs all client contract fixtures and labels their limited scope', () => {
  global.fetch = jest.fn();
  render(<StudioLab preview />);
  fireEvent.click(screen.getByRole('button', { name: 'Run all 6' }));
  expect(screen.getAllByText('PASS')).toHaveLength(6);
  expect(screen.getByText('SIMULATED INPUT')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Export fixture results' })).toBeEnabled();
  expect(fetch).not.toHaveBeenCalled();
});

it('reads only the chosen endpoint on demand and strips raw response fields', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ ...workspace, secret: 'never-render-this' }) })) as unknown as typeof fetch;
  render(<StudioLab canInspectRuntime />);
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Inspect endpoint' }));
  await screen.findByText(/Response contract checked/);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith('/api/hq/workspace', expect.objectContaining({ method: 'GET', cache: 'no-store', signal: expect.any(AbortSignal) }));
  expect(screen.getByRole('region', { name: 'Endpoint response' })).toHaveTextContent('unconfigured');
  expect(screen.queryByText(/never-render-this/)).not.toBeInTheDocument();
});

it('prevents simultaneous requests and shows a loading state', async () => {
  let resolve!: (value: unknown) => void;
  global.fetch = jest.fn(() => new Promise(done => { resolve = done; })) as unknown as typeof fetch;
  render(<StudioLab canInspectRuntime />);
  const button = screen.getByRole('button', { name: 'Inspect endpoint' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(screen.getByRole('button', { name: 'Reading endpoint…' })).toBeDisabled();
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => { resolve({ ok: true, status: 200, json: async () => workspace }); });
  expect(await screen.findByRole('button', { name: 'Inspect endpoint' })).toBeEnabled();
});

it('surfaces denied requests without exposing their body or retrying', async () => {
  const body = jest.fn();
  global.fetch = jest.fn(async () => ({ ok: false, status: 403, json: body })) as unknown as typeof fetch;
  render(<StudioLab canInspectRuntime />);
  fireEvent.click(screen.getByRole('button', { name: 'Inspect endpoint' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('server denied access');
  expect(body).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('discards malformed success responses', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ token: 'secret' }) })) as unknown as typeof fetch;
  render(<StudioLab canInspectRuntime />);
  fireEvent.click(screen.getByRole('button', { name: 'Inspect endpoint' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('did not match the expected contract');
  expect(screen.getByRole('region', { name: 'Endpoint response' })).not.toHaveTextContent('secret');
});

it('ends a stalled request at the deadline and permits an explicit later retry', async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
  render(<StudioLab canInspectRuntime />);
  fireEvent.click(screen.getByRole('button', { name: 'Inspect endpoint' }));
  await act(async () => { jest.advanceTimersByTime(12001); });
  expect(screen.getByRole('alert')).toHaveTextContent('interrupted or timed out');
  expect(screen.getByRole('button', { name: 'Inspect endpoint' })).toBeEnabled();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('aborts the request when the panel unmounts or loses access', async () => {
  let signal: AbortSignal | undefined;
  global.fetch = jest.fn((_url, options) => { signal = options?.signal as AbortSignal; return new Promise(() => {}); }) as typeof fetch;
  const { rerender, unmount } = render(<StudioLab canInspectRuntime />);
  fireEvent.click(screen.getByRole('button', { name: 'Inspect endpoint' }));
  rerender(<StudioLab canInspectRuntime={false} />);
  await waitFor(() => expect(signal?.aborted).toBe(true));
  expect(await screen.findByRole('button', { name: 'Inspect endpoint' })).toBeDisabled();
  unmount();
});
