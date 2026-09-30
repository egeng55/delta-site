import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import WorkspacePreview from './page';
import DesktopWorkspace from '@/components/desktop/DesktopWorkspace';
import { getWorkspaceAccess } from '@/lib/workspaceAccessServer';
import { readObservatoryReport } from '@/lib/observatoryServer';

jest.mock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NEXT_HTTP_ERROR_FALLBACK;404'); }) }));
jest.mock('@/lib/workspaceAccessServer', () => ({ getWorkspaceAccess: jest.fn() }));
jest.mock('@/lib/observatoryServer', () => ({ readObservatoryReport: jest.fn() }));
jest.mock('@/components/desktop/DesktopWorkspace', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="desktop-workspace">Disconnected preview</div>),
}));

const original = process.env;
beforeEach(() => { process.env = { ...original }; jest.clearAllMocks(); });
afterEach(() => { process.env = original; });

it.each(['owner', 'consumer', 'developer', 'stakeholder', 'admin', 'invented-admin'])('rejects production preview regardless of requested role %s', async role => {
  process.env = { ...process.env, NODE_ENV: 'production' };
  await expect(WorkspacePreview({ searchParams: Promise.resolve({ role }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  expect(notFound).toHaveBeenCalledTimes(1);
  expect(DesktopWorkspace).not.toHaveBeenCalled();
  expect(getWorkspaceAccess).not.toHaveBeenCalled();
  expect(readObservatoryReport).not.toHaveBeenCalled();
});

it('also rejects nondevelopment environments', async () => {
  process.env = { ...process.env, NODE_ENV: 'test' };
  await expect(WorkspacePreview({ searchParams: Promise.resolve({ role: 'owner' }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
});

it.each(['owner', 'consumer', 'developer', 'stakeholder', 'admin'])('uses a disconnected fixed identity for the local %s preview', async role => {
  process.env = { ...process.env, NODE_ENV: 'development' };
  render(await WorkspacePreview({ searchParams: Promise.resolve({ role }) }));
  expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument();
  expect(jest.mocked(DesktopWorkspace).mock.calls[0][0]).toMatchObject({
    preview: true,
    access: { userId: '00000000-0000-0000-0000-000000000000', role },
  });
  expect(getWorkspaceAccess).not.toHaveBeenCalled();
  expect(readObservatoryReport).not.toHaveBeenCalled();
});
