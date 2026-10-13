import { render } from "@testing-library/react";
import DeltaMarkScene from "./DeltaMarkScene";

jest.mock("three", () => ({}));

describe("DeltaMarkScene", () => {
  it("keeps the CSS mark and fails closed when WebGL is unavailable", () => {
    const matchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
    const context = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

    const { container } = render(<DeltaMarkScene />);

    expect(container.querySelector("span")).toBeInTheDocument();
    expect(container.querySelector("canvas")).not.toBeInTheDocument();

    context.mockRestore();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia,
    });
  });
});
