import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IntelligenceScene from "./IntelligenceScene";
import PublicNavigation from "./PublicNavigation";
import AccessPage from "@/app/(marketing)/access/page";
import ContactPage from "@/app/(marketing)/contact/page";

jest.mock("next/navigation", () => ({ usePathname: () => "/product" }));

describe("public intelligence walkthrough", () => {
  it("labels every example as illustrative and changes contexts without requests", async () => {
    const fetchMock = jest.fn();
    const original = global.fetch;
    global.fetch = fetchMock;
    try {
      render(<IntelligenceScene />);
      expect(screen.getByText(/Illustrative examples/)).toBeInTheDocument();
      expect(screen.getByRole("tabpanel")).toHaveTextContent(
        "No nutrition has been logged in this example",
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("tab", { name: /Your research/ }));
      expect(screen.getByRole("tabpanel")).toHaveTextContent(
        "directory listing is a lead",
      );
      await user.click(screen.getByRole("tab", { name: /Your software/ }));
      expect(screen.getByRole("tabpanel")).toHaveTextContent(
        "Not a claim of proven autonomy",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      global.fetch = original;
    }
  });

  it("supports keyboard navigation and a stable active tab/panel relationship", async () => {
    render(<IntelligenceScene />);
    const user = userEvent.setup();
    screen.getByRole("tab", { name: /Your day/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Your research/ })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /Your research/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      "tab-research",
    );
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Your software/ })).toHaveFocus();
    await user.keyboard("{Home}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: /Your software/ })).toHaveFocus();
  });
});

describe("public navigation and access", () => {
  it("opens the mobile menu and closes it with Escape or a selected link", async () => {
    render(<PublicNavigation />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      screen.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const contact = screen.getByRole("link", { name: /Contact/ });
    contact.addEventListener("click", (event) => event.preventDefault());
    await user.click(contact);
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
  });

  it("keeps request-only access and does not grant internal capabilities", () => {
    render(<AccessPage />);
    expect(
      screen
        .getAllByRole("link", { name: "Request access" })
        .map((link) => link.getAttribute("href")),
    ).toContain("/signup");
    expect(
      screen.getByText(/No. Requests, approval, and invitation/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not automatically included in preview access/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Log in to your account/ }),
    ).toHaveAttribute("href", "/login?redirect=/command");
  });
});

describe("contact submission", () => {
  const original = global.fetch;
  afterEach(() => {
    global.fetch = original;
  });
  function fillForm() {
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Test visitor" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "visitor@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Product question" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "A synthetic product question." },
    });
  }
  it("uses the existing support contract once and confirms success only after acceptance", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    render(<ContactPage />);
    fillForm();
    fireEvent.submit(screen.getByRole("form", { name: "Contact Delta" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Message received",
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toMatch(/\/support\/submit$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(
      expect.objectContaining({
        subject: "Product question",
        user_email: "visitor@example.test",
        metadata: { name: "Test visitor", source: "website", page: "/contact" },
      }),
    );
  });
  it("retains the message on rejection and never renders private server errors", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "private server payload" }),
      });
    render(<ContactPage />);
    fillForm();
    fireEvent.submit(screen.getByRole("form", { name: "Contact Delta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("not sent");
    expect(
      screen.queryByText(/private server payload/),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue(
      "A synthetic product question.",
    );
  });
  it("reports network failure honestly", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
    render(<ContactPage />);
    fillForm();
    fireEvent.submit(screen.getByRole("form", { name: "Contact Delta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not confirm delivery",
    );
  });
});
