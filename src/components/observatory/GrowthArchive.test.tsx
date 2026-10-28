import { fireEvent, render, screen } from '@testing-library/react';
import GrowthArchive, { growthGraphic } from './GrowthArchive';
import archive from '@/lib/historianArchive.json';
import type { HistorianArchive } from '@/lib/historian';
const data = archive as HistorianArchive;
it('renders a measured catalogue and exports the selected checkpoint', () => {
  const onSelect = jest.fn();
  const value = { ...data, growthArchive: { version: 1 as const, checkpoints: data.snapshots, comparisons: [{ comparison: data.comparison, snapshots: data.snapshots }] } };
  render(<GrowthArchive data={value} onSelect={onSelect} />);
  fireEvent.change(screen.getByLabelText('Recorded comparison'), { target: { value: data.comparison.id } });
  expect(onSelect).toHaveBeenCalledWith(data.comparison.id);
  expect(screen.getByText('Download checkpoint graphic (SVG)')).toHaveAttribute('download');
  expect(screen.getByText(/Gaps are not interpolated/)).toBeVisible();
});
it('escapes graphics and does not claim qualification', () => {
  const value = { ...data, comparison: { ...data.comparison, id: '<script>alert(1)</script>' } };
  const svg = growthGraphic(value);
  expect(svg).not.toContain('<script>');
  expect(svg).toContain('&lt;script&gt;');
  expect(svg).toContain('not intelligence quality or production qualification');
});
