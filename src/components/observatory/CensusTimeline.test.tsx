import { fireEvent, render, screen, within } from "@testing-library/react";
import CensusTimeline from "./CensusTimeline";
import archive from "@/lib/historianArchive.json";
import type { HistorianArchive } from "@/lib/historian";
it("shows every retained checkpoint and lets the reader inspect one independently of comparisons", () => {
  const data = archive as HistorianArchive;
  render(<CensusTimeline data={data} />);
  const checkpoints = within(screen.getByRole("list",{name:"Census checkpoints"})).getAllByRole("button");
  expect(checkpoints).toHaveLength(data.growthArchive!.checkpoints.length);
  fireEvent.click(checkpoints[0]);
  expect(checkpoints[0]).toHaveAttribute("aria-pressed","true");
  expect(within(screen.getByLabelText("Selected census")).getByText(data.growthArchive!.checkpoints[0].id)).toBeVisible();
  fireEvent.change(screen.getByLabelText("Measurement"),{target:{value:"test_loc"}});
  expect(screen.getByText(/Snapshots are never summed/)).toBeVisible();
});
it("renders an empty archive without fabricated progress", () => {
  render(<CensusTimeline data={{...archive as HistorianArchive, growthArchive:{version:1,comparisons:[],checkpoints:[]}}} />);
  expect(screen.getByText("No valid census checkpoints are available.")).toBeVisible();
});
