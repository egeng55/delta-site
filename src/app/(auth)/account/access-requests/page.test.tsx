import { act, fireEvent, render, screen } from "@testing-library/react";
import AccessRequestsPage from "./page";
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    session: { access_token: "fixture" },
    user: { role: "admin" },
    isLoading: false,
  }),
}));
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
const row = {
  id: "one",
  name: "Fixture",
  email: "fixture@example.test",
  reason: null,
  status: "submitted",
  submitted_at: "2026-09-16T00:00:00Z",
};

it("separates loading, empty, and failed-request states", async () => {
  let resolve!: (response: unknown) => void;
  global.fetch = jest.fn(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  ) as jest.Mock;
  render(<AccessRequestsPage />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading access requests",
  );
  expect(screen.queryByText("No access requests.")).not.toBeInTheDocument();
  await act(async () => resolve({ ok: false, status: 503 }));
  expect(screen.getByRole("alert")).toHaveTextContent("Could not load");
  expect(screen.queryByText("No access requests.")).not.toBeInTheDocument();
  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        requests: [],
        nextOffset: null,
        windowLimited: false,
      }),
    });
  fireEvent.click(screen.getByRole("button", { name: "Reload requests" }));
  expect(await screen.findByText("No access requests.")).toBeInTheDocument();
});

it("uses bounded pages and does not refetch on unrelated renders", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        requests: [row],
        nextOffset: 50,
        windowLimited: false,
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        requests: [],
        nextOffset: null,
        windowLimited: false,
      }),
    });
  render(<AccessRequestsPage />);
  await screen.findByText("Fixture");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("No access requests.");
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect((global.fetch as jest.Mock).mock.calls.map((call) => call[0])).toEqual(
    ["/api/access-requests?offset=0", "/api/access-requests?offset=50"],
  );
});
