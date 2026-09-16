import { act, fireEvent, render, screen } from "@testing-library/react";
import AccessRequestForm from "./AccessRequestForm";
import ContactPage from "@/app/(marketing)/contact/page";
jest.mock("next/navigation", () => ({ usePathname: () => "/contact" }));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

it("blocks duplicate submissions in the same event turn and preserves the accepted state", async () => {
  let resolve!: (response: unknown) => void;
  global.fetch = jest.fn(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  ) as jest.Mock;
  render(<AccessRequestForm />);
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Fixture" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "fixture@example.test" },
  });
  const form = screen.getByRole("form", { name: "Request access" });
  act(() => {
    fireEvent.submit(form);
    fireEvent.submit(form);
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(form).toHaveAttribute("aria-busy", "true");
  await act(async () =>
    resolve({ ok: true, status: 202, json: async () => ({ accepted: true }) }),
  );
  expect(screen.getByText("Request submitted")).toBeInTheDocument();
});

it("does not mistake a malformed success for a recorded request", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  render(<AccessRequestForm />);
  fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not confirm",
  );
  expect(screen.queryByText("Request submitted")).not.toBeInTheDocument();
});

it("times out without retrying, retains input, and restores a usable form", async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn(() => new Promise(() => undefined));
  render(<AccessRequestForm />);
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Fixture" },
  });
  fireEvent.submit(screen.getByRole("form"));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(15000);
  });
  expect(screen.getByRole("alert")).toHaveTextContent("could not confirm");
  expect(screen.getByLabelText("Name")).toHaveValue("Fixture");
  expect(screen.getByRole("button")).not.toBeDisabled();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it("also prevents simultaneous contact submissions", async () => {
  let resolve!: (response: unknown) => void;
  global.fetch = jest.fn(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  ) as jest.Mock;
  render(<ContactPage />);
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "A synthetic test message." },
  });
  const form = screen.getByRole("form");
  act(() => {
    fireEvent.submit(form);
    fireEvent.submit(form);
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  await act(async () =>
    resolve({ ok: true, status: 200, json: async () => ({}) }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Message received");
});
