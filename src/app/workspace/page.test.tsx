import { fireEvent, render, screen } from '@testing-library/react';
import WorkspacePage from './page';
import DesktopWorkspace from '@/components/desktop/DesktopWorkspace';
import { getWorkspaceAccess } from '@/lib/workspaceAccessServer';
import { workspaceAccessFor } from '@/lib/workspaceAccess';
import { readObservatoryReport } from '@/lib/observatoryServer';

jest.mock('@/lib/workspaceAccessServer', () => ({ getWorkspaceAccess: jest.fn() }));
jest.mock('@/lib/observatoryServer', () => ({ readObservatoryReport: jest.fn() }));
jest.mock('next/dynamic', () => () => function RuntimePanel() { return <div data-testid="runtime-panel" />; });
jest.mock('@/components/desktop/DesktopWorkspace', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="desktop-workspace">Authorized workspace</div>),
}));

beforeEach(() => jest.clearAllMocks());

it.each([
  ['signed_out', 'Your work starts with you.'],
  ['denied', 'This account cannot enter the workspace.'],
  ['unconfigured', 'Workspace access needs configuration.'],
] as const)('does not instantiate the application or read private reports when %s', async (status, message) => {
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status });
  render(await WorkspacePage({}));
  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Sign in to Delta/ })).toHaveAttribute('href', '/login?redirect=%2Fworkspace');
  expect(screen.queryByTestId('desktop-workspace')).not.toBeInTheDocument();
  expect(DesktopWorkspace).not.toHaveBeenCalled();
  expect(readObservatoryReport).not.toHaveBeenCalled();
});

it('resets Results to Activity when client navigation opens a task link', async () => {
  const access = workspaceAccessFor('verified-user', 'owner');
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status: 'authenticated', access });
  const ActualWorkspace = jest.requireActual<typeof import('@/components/desktop/DesktopWorkspace')>('@/components/desktop/DesktopWorkspace').default;
  jest.mocked(DesktopWorkspace).mockImplementation(props => <ActualWorkspace {...props} preview />);
  const view = render(await WorkspacePage({}));
  fireEvent.click(screen.getByRole('button', { name: /Results 03/ }));
  expect(screen.getByRole('heading', { name: 'Something to show for it.' })).toBeInTheDocument();
  view.rerender(await WorkspacePage({ searchParams: Promise.resolve({ task: '12345678-1234-1234-1234-123456789012' }) }));
  expect(screen.getByRole('heading', { name: 'Follow the work.' })).toBeInTheDocument();
  jest.mocked(DesktopWorkspace).mockImplementation(() => <div data-testid="desktop-workspace">Authorized workspace</div>);
});

it('passes only server-resolved permissions into the application without eagerly reading owner data', async () => {
  const access = workspaceAccessFor('verified-user', 'stakeholder');
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status: 'authenticated', access });
  render(await WorkspacePage({}));
  expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument();
  expect(jest.mocked(DesktopWorkspace).mock.calls[0][0]).toEqual({ access, initialTask: false });
  expect(readObservatoryReport).not.toHaveBeenCalled();
});

it.each([
  ['12345678-1234-1234-1234-123456789012', true],
  ['invalid-task', false],
  [undefined, false],
] as const)('opens Activity only for a valid task deep link (%s)', async (task, opensActivity) => {
  const access = workspaceAccessFor('verified-user', 'owner');
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status: 'authenticated', access });
  const ActualWorkspace = jest.requireActual<typeof import('@/components/desktop/DesktopWorkspace')>('@/components/desktop/DesktopWorkspace').default;
  // Exercise the real navigation while keeping this routing test disconnected from runtime services.
  jest.mocked(DesktopWorkspace).mockImplementationOnce(props => <ActualWorkspace {...props} preview />);
  render(await WorkspacePage({ searchParams: Promise.resolve({ task }) }));
  expect(jest.mocked(DesktopWorkspace).mock.calls[0][0]).toEqual({ access, initialTask: opensActivity });
  if (opensActivity) {
    expect(screen.getByRole('heading', { name: 'Follow the work.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Activity/ })).toHaveAttribute('aria-current', 'page');
  } else {
    expect(screen.getByRole('textbox', { name: 'Your request' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overview/ })).toHaveAttribute('aria-current', 'page');
  }
  expect(readObservatoryReport).not.toHaveBeenCalled();
});
