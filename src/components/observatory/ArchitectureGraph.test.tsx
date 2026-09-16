import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArchitectureGraph from './ArchitectureGraph';
import { observatoryPreview } from '@/lib/observatoryPreview';
import { boundedGraphScale } from '@/lib/graphViewport';
const mockEvents: Record<string, (...args: unknown[]) => void> = {};
let mockScale = 1;
const mockMove = jest.fn((options: { scale: number }) => { mockScale = options.scale; });
const mockFit = jest.fn(() => { mockScale = 0.8; });
const mockDestroy = jest.fn();
jest.mock('vis-network/standalone', () => ({ Network: jest.fn().mockImplementation(() => ({
  on: (name: string, cb: () => void) => { mockEvents[name] = cb; },
  once: (name: string, cb: () => void) => { mockEvents[name] = cb; },
  moveTo: mockMove, fit: mockFit, getScale: () => mockScale,
  getViewPosition: () => ({ x: 12, y: 23 }), setOptions: jest.fn(), destroy: mockDestroy,
})) }));
it('clamps wheel/touch/keyboard zoom events and button zoom to the same limits', async () => {
  const { unmount } = render(<ArchitectureGraph graph={observatoryPreview().graphs[0]} query="" repo="all" revision={0} onSelect={jest.fn()} />);
  await waitFor(() => expect(mockEvents.zoom).toBeDefined());
  act(() => { mockEvents.stabilizationIterationsDone(); });
  act(() => { mockScale = 99; mockEvents.zoom(); });
  expect(mockScale).toBe(3); expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  act(() => { mockScale = 0.0001; mockEvents.zoom(); });
  expect(mockScale).toBe(.15); expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Reset viewport' }));
  expect(mockMove).toHaveBeenLastCalledWith({ scale: .8, position: { x: 12, y: 23 }, animation: false });
  fireEvent.click(screen.getByRole('button', { name: 'Fit graph' })); expect(mockFit).toHaveBeenCalled();
  unmount(); expect(mockDestroy).toHaveBeenCalled();
});
it.each([NaN, Infinity, -Infinity])('handles non-finite viewport scale %s', value => expect(boundedGraphScale(value)).toBe(1));
