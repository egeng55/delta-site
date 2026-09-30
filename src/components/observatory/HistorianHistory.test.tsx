import { render, screen, fireEvent, within } from "@testing-library/react";
import HistorianHistory from "./HistorianHistory";
import archive from "@/lib/historianArchive.json";
const original = global.fetch;
beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => archive });
});
afterEach(() => {
  global.fetch = original;
});
it("keeps the real archive behind sign-in in preview mode", () => {
  render(<HistorianHistory preview />);
  expect(fetch).not.toHaveBeenCalled();
  expect(
    screen.getByText(/Sign in to the private workspace/),
  ).toBeInTheDocument();
});
it("exposes every milestone through ocean chapters and preserves measured census scope", async () => {
  render(<HistorianHistory />);
  await screen.findByRole("heading", { name: "An idea becomes a system." });
  expect(
    screen
      .getByRole("navigation", { name: "Ocean chapters" })
      .querySelectorAll("button"),
  ).toHaveLength(6);
  for (const milestone of archive.milestones)
    expect(screen.getByText(milestone.title)).toBeInTheDocument();
  const origin = screen.getByText("Delta Origin").closest("details")!;
  fireEvent.click(within(origin).getByText("Delta Origin"));
  expect(origin).toHaveAttribute("open");
  expect(within(origin).getByText(archive.milestones[0].gained)).toBeVisible();
  fireEvent.change(screen.getByLabelText("Census metric"), {
    target: { value: "unique_tests" },
  });
  expect(
    screen.getByRole("img", { name: "Unique tests: 365 to 417" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/not every repository’s test suite/),
  ).toBeInTheDocument();
});
it("shows an unavailable state with retry on an unauthorized or failed read", async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: false } as Response);
  render(<HistorianHistory />);
  expect(
    await screen.findByRole("button", { name: "Retry history" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Delta through time.")).not.toBeInTheDocument();
});
