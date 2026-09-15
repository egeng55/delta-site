import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WhoopIntegrationPage from "./page";
import { useAuth } from "@/context/AuthContext";
import {
  disconnectWhoopConnection,
  getWhoopConnectionStatus,
  syncWhoopConnection,
} from "@/lib/whoopIntegrationApi";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/whoopIntegrationApi", () => ({
  getWhoopConnectionStatus: jest.fn(),
  startWhoopConnection: jest.fn(),
  syncWhoopConnection: jest.fn(),
  disconnectWhoopConnection: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetStatus =
  getWhoopConnectionStatus as jest.MockedFunction<
    typeof getWhoopConnectionStatus
  >;
const mockSync = syncWhoopConnection as jest.MockedFunction<
  typeof syncWhoopConnection
>;
const mockDisconnect = disconnectWhoopConnection as jest.MockedFunction<
  typeof disconnectWhoopConnection
>;

describe("WHOOP integration page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("checks WHOOP status once a session exists even while profile hydration continues", async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "delta-session" },
      isLoading: true,
    } as ReturnType<typeof useAuth>);
    mockGetStatus.mockResolvedValue({
      connected: false,
      status: "not_connected",
    });

    render(<WhoopIntegrationPage />);

    await waitFor(() =>
      expect(mockGetStatus).toHaveBeenCalledWith("delta-session"),
    );
    expect(
      await screen.findByRole("button", { name: "Connect WHOOP" }),
    ).toBeInTheDocument();
  });

  it("refreshes a connected WHOOP account on demand", async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "delta-session" },
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    mockGetStatus.mockResolvedValue({
      connected: true,
      status: "active",
      last_synced_at: "2026-08-03T12:00:00Z",
    });
    mockSync.mockResolvedValue({
      status: "completed",
      synced_at: "2026-08-03T12:05:00Z",
      counts: {},
      raw_provider_payloads_stored: false,
    });

    render(<WhoopIntegrationPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Refresh now" }));

    await waitFor(() => expect(mockSync).toHaveBeenCalledWith("delta-session"));
    expect(await screen.findByText("WHOOP data refreshed.")).toBeInTheDocument();
  });

  it("requires explicit confirmation before deleting WHOOP history", async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "delta-session" },
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    mockGetStatus.mockResolvedValue({ connected: true, status: "active" });
    mockDisconnect.mockResolvedValue({
      status: "disconnected",
      provider_access_revoked: true,
      credentials_deleted: true,
      history_deleted: true,
    });

    render(<WhoopIntegrationPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Disconnect WHOOP" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /also permanently delete normalized whoop/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Delete history and disconnect" }),
    );

    await waitFor(() =>
      expect(mockDisconnect).toHaveBeenCalledWith("delta-session", true),
    );
    expect(
      await screen.findByText(
        "WHOOP disconnected. Stored WHOOP history was deleted.",
      ),
    ).toBeInTheDocument();
  });

  it("allows a stored connection to be disconnected after authorization expires", async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "delta-session" },
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    mockGetStatus.mockResolvedValue({
      connected: false,
      status: "reauthorization_required",
    });

    render(<WhoopIntegrationPage />);

    expect(
      await screen.findByText("WHOOP needs to be authorized again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Disconnect WHOOP" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Refresh now" }),
    ).not.toBeInTheDocument();
  });
});
