import {
  canOwnerTransitionAccessRequest,
  isAccessRequestStatus,
  parseAccessRequestInput,
} from "./accessRequests";

describe("access request policy", () => {
  it("normalizes and validates a minimal request", () => {
    expect(
      parseAccessRequestInput({
        name: "  Eric Geng  ",
        email: "  ERIC@example.com ",
        reason: "",
        company: "",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Eric Geng",
        email: "eric@example.com",
        reason: null,
        company: "",
      },
    });
  });

  it("rejects malformed or excessive request data", () => {
    expect(parseAccessRequestInput({ name: "E", email: "bad" }).ok).toBe(false);
    expect(
      parseAccessRequestInput({
        name: "Eric",
        email: "eric@example.com",
        reason: "x".repeat(1201),
      }).ok,
    ).toBe(false);
  });

  it("allows owner review transitions but reserves invited for the invite action", () => {
    expect(canOwnerTransitionAccessRequest("submitted", "reviewing")).toBe(true);
    expect(canOwnerTransitionAccessRequest("reviewing", "approved")).toBe(true);
    expect(canOwnerTransitionAccessRequest("approved", "invited")).toBe(false);
    expect(canOwnerTransitionAccessRequest("invited", "reviewing")).toBe(false);
    expect(isAccessRequestStatus("declined")).toBe(true);
    expect(isAccessRequestStatus("pending")).toBe(false);
  });
});
