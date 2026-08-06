import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CommandPage from "./page";
import { useAuth } from "@/context/AuthContext";
import {
  getWhoopConnectionStatus,
  syncWhoopConnection,
} from "@/lib/whoopIntegrationApi";

jest.mock("@/components/Navigation", () => function Navigation() {
  return <nav>Navigation</nav>;
});

jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/whoopIntegrationApi", () => ({
  getWhoopConnectionStatus: jest.fn(),
  syncWhoopConnection: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockStatus = getWhoopConnectionStatus as jest.MockedFunction<
  typeof getWhoopConnectionStatus
>;
const mockSync = syncWhoopConnection as jest.MockedFunction<
  typeof syncWhoopConnection
>;

describe("Command page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { email: "owner@example.test" },
      session: { access_token: "delta-session" },
    } as ReturnType<typeof useAuth>);
    mockStatus.mockResolvedValue({
      connected: true,
      status: "active",
      last_synced_at: new Date().toISOString(),
    });
  });

  it("shows real connector state and read-only capability boundaries", async () => {
    render(<CommandPage />);

    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("whoop_get_daily_summary")).toBeInTheDocument();
    expect(screen.getByText("No pending provider actions")).toBeInTheDocument();
    expect(screen.getByText(/cross-provider activity ledger is not implemented/i)).toBeInTheDocument();
  });

  it("runs a bounded explicit refresh", async () => {
    mockSync.mockResolvedValue({
      status: "completed",
      synced_at: new Date().toISOString(),
      counts: {},
      raw_provider_payloads_stored: false,
    });
    render(<CommandPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Refresh WHOOP now" }),
    );

    await waitFor(() => expect(mockSync).toHaveBeenCalledWith("delta-session"));
    expect(
      await screen.findByText("WHOOP data refreshed for future ChatGPT requests."),
    ).toBeInTheDocument();
  });
});
