import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Redirect } from "../redirect";
import { router } from "../router";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Redirect", () => {
  it("calls router.replace() on mount by default", () => {
    const replaceSpy = vi.spyOn(router, "replace").mockImplementation(() => {});

    render(<Redirect to="/home" />);

    expect(replaceSpy).toHaveBeenCalledWith({ pathname: "/home" });
  });

  it("calls router.push() when push is true", () => {
    const pushSpy = vi.spyOn(router, "push").mockImplementation(() => {});

    render(<Redirect to="/home" push />);

    expect(pushSpy).toHaveBeenCalledWith({ pathname: "/home" });
  });

  it("renders no DOM output (T-008)", () => {
    vi.spyOn(router, "replace").mockImplementation(() => {});

    const { container } = render(<Redirect to="/home" />);

    expect(container.innerHTML).toBe("");
  });
});
