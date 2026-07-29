import { render, screen, waitFor } from "@testing-library/react";
import WhoopIntegrationPage from "./page";
import { useAuth } from "@/context/AuthContext";
import { getWhoopConnectionStatus } from "@/lib/whoopIntegrationApi";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/whoopIntegrationApi", () => ({
  getWhoopConnectionStatus: jest.fn(),
  startWhoopConnection: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetStatus =
  getWhoopConnectionStatus as jest.MockedFunction<
    typeof getWhoopConnectionStatus
  >;

describe("WHOOP integration page", () => {
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
});
