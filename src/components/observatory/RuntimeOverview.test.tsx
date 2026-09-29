import { render, screen, waitFor } from '@testing-library/react';
import RuntimeOverview from './RuntimeOverview';
import { requestJson } from '@/lib/requestJson';
jest.mock('@/lib/requestJson', () => ({ requestJson: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it('keeps synthetic preview offline', () => { render(<RuntimeOverview preview />); expect(screen.getByText(/Design preview/)).toBeInTheDocument(); expect(requestJson).not.toHaveBeenCalled(); });
it('surfaces unconfigured connection without invented counters', async () => {
 jest.mocked(requestJson).mockResolvedValue({ ok: true, status: 200, data: { version: 1, connection: 'unconfigured', runtime: null } });
 render(<RuntimeOverview />); await waitFor(() => expect(screen.getByText('Runtime connector not configured.')).toBeInTheDocument()); expect(screen.queryByText('Retained commands')).not.toBeInTheDocument();
});
it('clears data when owner access is denied', async () => {
 jest.mocked(requestJson).mockResolvedValue({ ok: false, status: 403, data: null }); render(<RuntimeOverview />);
 await waitFor(() => expect(screen.getByText('Owner session required.')).toBeInTheDocument()); expect(screen.queryByText('Retained commands')).not.toBeInTheDocument();
});
