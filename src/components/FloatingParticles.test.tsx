import React from "react";
import { render, screen } from "@testing-library/react";
import FloatingParticles from "./FloatingParticles";

jest.mock("framer-motion", () => {
  const MotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  );
  MotionDiv.displayName = "MotionDiv";

  return {
    motion: {
      div: MotionDiv,
    },
    easeInOut: jest.fn(),
    useReducedMotion: jest.fn(() => false),
  };
});

describe("FloatingParticles", () => {
  const randomValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.05];
  let randomSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    let call = 0;
    randomSpy = jest.spyOn(Math, "random").mockImplementation(() => {
      const value = randomValues[call % randomValues.length];
      call += 1;
      return value;
    });
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it("renders the requested number of particles", () => {
    render(<FloatingParticles count={3} />);
    expect(screen.getAllByTestId("particle")).toHaveLength(3);
  });

  it("uses stable drift values across rerenders with the same count", () => {
    const { rerender } = render(<FloatingParticles count={3} />);
    const firstRender = screen.getAllByTestId("particle").map((el) => el.getAttribute("data-drift"));

    rerender(<FloatingParticles count={3} />);
    const secondRender = screen.getAllByTestId("particle").map((el) => el.getAttribute("data-drift"));

    expect(secondRender).toEqual(firstRender);
  });

  it("regenerates particles when the count changes", () => {
    const { rerender } = render(<FloatingParticles count={2} />);
    const initialDrifts = screen.getAllByTestId("particle").map((el) => el.getAttribute("data-drift"));

    rerender(<FloatingParticles count={3} />);
    const updatedDrifts = screen.getAllByTestId("particle").map((el) => el.getAttribute("data-drift"));

    expect(updatedDrifts).toHaveLength(3);
    expect(updatedDrifts.slice(0, 2)).not.toEqual(initialDrifts);
  });
});
