import { render, screen, waitFor } from "@testing-library/react";
import OAuthConsentPage from "./page";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

const replace = jest.fn();
const getAuthorizationDetails = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("authorization_id=request-123"),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  getSupabase: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;

describe("OAuth consent page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabase.mockReturnValue({
      auth: {
        oauth: {
          getAuthorizationDetails,
        },
      },
    } as ReturnType<typeof getSupabase>);
  });

  it("waits for the shared auth provider before loading authorization details", () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: true,
    } as ReturnType<typeof useAuth>);

    render(<OAuthConsentPage />);

    expect(getAuthorizationDetails).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("loads authorization details with the shared authenticated session", async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "delta-session" },
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    getAuthorizationDetails.mockResolvedValue({
      data: {
        client: { name: "ChatGPT" },
        user: { email: "owner@example.com" },
        scope: "openid",
        redirect_url: null,
      },
      error: null,
    });

    render(<OAuthConsentPage />);

    expect(await screen.findByRole("heading", { name: "ChatGPT" })).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("openid")).toBeInTheDocument();
    expect(getAuthorizationDetails).toHaveBeenCalledWith("request-123");
  });

  it("preserves the authorization request when authentication is required", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    render(<OAuthConsentPage />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/login?redirect=%2Foauth%2Fconsent%3Fauthorization_id%3Drequest-123",
      ),
    );
    expect(getAuthorizationDetails).not.toHaveBeenCalled();
  });
});
