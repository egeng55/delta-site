import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { workspaceAccessFor } from '@/lib/workspaceAccess';
import DesktopWorkspace from './DesktopWorkspace';

// The shell's responsibility is whether an owner surface is mounted and which
// objective it receives. Each live child has its own transport/contract tests.
jest.mock('next/dynamic', () => () => function RuntimePanel(props: { input?: string; preview?: boolean }) {
  return <section data-testid="owner-runtime-component"><span>Owner runtime surface</span>{props.input !== undefined && <p>Received objective: {props.input}</p>}<span>{props.preview ? 'Preview runtime' : 'Live runtime'}</span></section>;
});

const originalFetch = global.fetch;
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { global.fetch = originalFetch; });
const access = (role: Parameters<typeof workspaceAccessFor>[1]) => workspaceAccessFor('verified-user', role);
function selectPage(name: string) { fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: new RegExp(`^${name}`) })); }
function selectSpace(name: string) { fireEvent.click(within(screen.getByRole('group', { name: 'Workspaces' })).getByRole('button', { name })); }

it('keeps the entire owner preview disconnected while navigating all workspaces', () => {
  render(<DesktopWorkspace access={access('owner')} preview />);
  selectPage('Activity');
  expect(screen.getByText('Preview runtime')).toBeInTheDocument();
  selectPage('Results');
  expect(screen.getByText('Your work will live here.')).toBeInTheDocument();
  selectSpace('Studio');
  selectPage('Test lab');
  fireEvent.click(screen.getByRole('button', { name: 'Run all 6' }));
  expect(screen.getAllByText('PASS')).toHaveLength(6);
  selectSpace('Control');
  expect(screen.getByText('Preview — no source report connected.')).toBeInTheDocument();
  selectPage('Costs');
  expect(screen.getByText('Preview runtime')).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('limits a consumer to Personal and preserves the request for scope review', () => {
  render(<DesktopWorkspace access={access('consumer')} />);
  const workspaces = within(screen.getByRole('group', { name: 'Workspaces' }));
  expect(workspaces.getAllByRole('button')).toHaveLength(1);
  expect(workspaces.getByRole('button', { name: 'Personal' })).toBeInTheDocument();
  const objective = 'Investigate why my workspace import fails, then show the evidence.';
  fireEvent.change(screen.getByRole('textbox', { name: 'Your request' }), { target: { value: objective } });
  fireEvent.click(screen.getByRole('button', { name: 'Review request' }));
  expect(screen.getByRole('textbox', { name: 'Task objective' })).toHaveValue(objective);
  expect(screen.getByText('Your execution connection is not provisioned')).toBeInTheDocument();
  expect(screen.queryByTestId('owner-runtime-component')).not.toBeInTheDocument();
  selectPage('Results');
  expect(screen.queryByTestId('owner-runtime-component')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('forwards an owner objective intact to the execution desk only after review', () => {
  render(<DesktopWorkspace access={access('owner')} preview />);
  expect(screen.queryByTestId('owner-runtime-component')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Review request' })).toBeDisabled();
  const objective = 'Fix pagination without changing response validation.';
  fireEvent.change(screen.getByRole('textbox', { name: 'Your request' }), { target: { value: objective } });
  fireEvent.click(screen.getByRole('button', { name: 'Review request' }));
  expect(screen.getByTestId('owner-runtime-component')).toHaveTextContent(`Received objective: ${objective}`);
  expect(fetch).not.toHaveBeenCalled();
});

it('allows developer fixtures while keeping private execution, repositories and runtime hidden', () => {
  render(<DesktopWorkspace access={access('developer')} />);
  selectSpace('Studio');
  expect(screen.getByText('Your execution connection is not provisioned')).toBeInTheDocument();
  selectPage('Engineering');
  expect(screen.getByText('Repository evidence is owner-scoped')).toBeInTheDocument();
  selectPage('Runtime');
  expect(screen.getByText('Runtime inspection requires an owner session')).toBeInTheDocument();
  selectPage('Test lab');
  expect(screen.getByRole('button', { name: 'Inspect endpoint' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));
  expect(screen.getByText('Valid command is retained')).toBeInTheDocument();
  expect(screen.queryByTestId('owner-runtime-component')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('gives stakeholders only permitted summary reads and no owner components', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ summary: { available: false, observedAt: null, counts: null, statuses: { snapshot: 'unavailable', runtime: 'not_observed', deployment: 'not_observed' } } }) })) as unknown as typeof fetch;
  render(<DesktopWorkspace access={access('stakeholder')} />);
  expect(within(screen.getByRole('group', { name: 'Workspaces' })).getAllByRole('button')).toHaveLength(1);
  await screen.findByText('No permitted source snapshot is connected.');
  expect(fetch).toHaveBeenCalledWith('/api/workspace/summary', expect.any(Object));
  selectPage('Costs');
  expect(screen.getByText('Billing details require an owner grant')).toBeInTheDocument();
  expect(screen.queryByTestId('owner-runtime-component')).not.toBeInTheDocument();
  expect((fetch as jest.Mock).mock.calls.every(([url]) => url === '/api/workspace/summary')).toBe(true);
});

it('filters search to current permissions, handles no matches, and restores focus on Escape', () => {
  render(<DesktopWorkspace access={access('consumer')} />);
  const trigger = screen.getByRole('button', { name: /Find your way/ });
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  const dialog = screen.getByRole('dialog', { name: 'Find your way' });
  const query = within(dialog).getByRole('textbox', { name: 'Search workspace pages' });
  expect(within(dialog).queryByRole('button', { name: /Engineering/ })).not.toBeInTheDocument();
  fireEvent.change(query, { target: { value: 'runtime' } });
  expect(within(dialog).getByText('No pages match “runtime”.')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.change(screen.getByRole('textbox', { name: 'Search workspace pages' }), { target: { value: 'results' } });
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Results Personal/ }));
  expect(screen.getByRole('heading', { name: 'Something to show for it.' })).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('removes a workspace immediately when verified access changes', async () => {
  const { rerender } = render(<DesktopWorkspace access={access('owner')} preview />);
  selectSpace('Control');
  expect(screen.getByRole('region', { name: 'Workspace summary' })).toBeInTheDocument();
  rerender(<DesktopWorkspace access={access('consumer')} preview />);
  await waitFor(() => expect(screen.queryByRole('region', { name: 'Workspace summary' })).not.toBeInTheDocument());
  expect(screen.getByRole('navigation', { name: 'Personal navigation' })).toBeInTheDocument();
  expect(screen.queryByTestId('owner-runtime-component')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('locks a pending signout and allows one explicit retry after failure', async () => {
  let finish!: (value: unknown) => void;
  global.fetch = jest.fn(() => new Promise<unknown>(resolve => { finish = resolve; })) as unknown as typeof fetch;
  render(<DesktopWorkspace access={access('consumer')} />);
  const button = screen.getByRole('button', { name: 'Sign out of Delta' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(screen.getByRole('button', { name: 'Signing out' })).toBeDisabled();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith('/api/hq/signout', expect.objectContaining({ method: 'POST' }));
  await act(async () => { finish({ ok: false, status: 503 }); });
  expect(await screen.findByRole('alert')).toHaveTextContent('Sign out failed. Try again to confirm your session has ended.');
  expect(screen.getByRole('button', { name: 'Sign out of Delta' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out of Delta' }));
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => { finish({ ok: false, status: 503 }); });
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});

it('does not sign out from the disconnected preview', () => {
  render(<DesktopWorkspace access={access('owner')} preview />);
  const button = screen.getByRole('button', { name: 'Sign out of Delta' });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(fetch).not.toHaveBeenCalled();
});
