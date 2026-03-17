import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Link } from "../link";
import { router } from "../router";

beforeEach(() => {
  vi.spyOn(router, "push").mockImplementation(() => {});
  vi.spyOn(router, "replace").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Link", () => {
  it("renders an <a> with correct href, className, and title", () => {
    render(
      <Link to="/about" className="nav-link" title="About page">
        About
      </Link>,
    );

    const anchor = screen.getByRole("link", { name: "About" });
    expect(anchor).toHaveAttribute("href", "/about");
    expect(anchor).toHaveAttribute("class", "nav-link");
    expect(anchor).toHaveAttribute("title", "About page");
  });

  it("renders children inside the anchor", () => {
    render(
      <Link to="/test" title="Test">
        <span>Child Content</span>
      </Link>,
    );

    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("calls router.replace() by default on click", () => {
    render(
      <Link to="/about" title="About">
        About
      </Link>,
    );

    fireEvent.click(screen.getByRole("link", { name: "About" }));

    expect(router.replace).toHaveBeenCalledWith({ pathname: "/about" });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("calls router.push() when push prop is true", () => {
    render(
      <Link to="/about" title="About" push>
        About
      </Link>,
    );

    fireEvent.click(screen.getByRole("link", { name: "About" }));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/about" });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("renders nothing when hidden is true", () => {
    const { container } = render(
      <Link to="/about" title="About" hidden>
        About
      </Link>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("does not intercept Ctrl+Click (T-004)", () => {
    render(
      <Link to="/about" title="About">
        About
      </Link>,
    );

    fireEvent.click(screen.getByRole("link", { name: "About" }), {
      ctrlKey: true,
    });

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not intercept Meta+Click (T-004)", () => {
    render(
      <Link to="/about" title="About">
        About
      </Link>,
    );

    fireEvent.click(screen.getByRole("link", { name: "About" }), {
      metaKey: true,
    });

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not intercept middle-click (T-004)", () => {
    render(
      <Link to="/about" title="About">
        About
      </Link>,
    );

    fireEvent.click(screen.getByRole("link", { name: "About" }), {
      button: 1,
    });

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});
