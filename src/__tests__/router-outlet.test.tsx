import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { RouterOutlet } from "../router-outlet";
import { router } from "../router";

const Home = () => <div>Home Page</div>;
const NotFound = () => <div>404 Not Found</div>;

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  router.unregister();
});

describe("RouterOutlet", () => {
  it("renders fallback when router is not initialized", () => {
    router.isInitialized = false;
    router.fallback = <div>Loading...</div>;

    render(<RouterOutlet />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    router.isInitialized = false;
  });

  it("renders matched component after init", () => {
    router.init({
      limitedRouteTree: {
        "/": { component: Home },
      },
      defaultPageTitle: "Test",
      defaultNotFoundComponent: NotFound,
      fallback: <div>Loading...</div>,
    });

    render(<RouterOutlet />);

    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("re-renders with new component on navigation", () => {
    const About = () => <div>About Page</div>;

    router.init({
      limitedRouteTree: {
        "/": { component: Home },
        "/about": { component: About },
      },
      defaultPageTitle: "Test",
      defaultNotFoundComponent: NotFound,
      fallback: <div>Loading...</div>,
    });

    render(<RouterOutlet />);

    expect(screen.getByText("Home Page")).toBeInTheDocument();

    act(() => {
      router.push({ pathname: "/about" });
    });

    expect(screen.getByText("About Page")).toBeInTheDocument();
  });

  it("wraps component in Suspense with fallback", async () => {
    let resolveLazy: (mod: { default: React.ComponentType }) => void;
    const LazyComponent = React.lazy(
      () =>
        new Promise<{ default: React.ComponentType }>((resolve) => {
          resolveLazy = resolve;
        }),
    );

    router.init({
      limitedRouteTree: {
        "/lazy": { component: LazyComponent },
      },
      defaultPageTitle: "Test",
      defaultNotFoundComponent: NotFound,
      fallback: <div>Suspense Fallback</div>,
    });

    // Navigate to the lazy route
    router.replace({ pathname: "/lazy" });

    render(<RouterOutlet />);

    // While the lazy component is loading, Suspense fallback should show
    expect(screen.getByText("Suspense Fallback")).toBeInTheDocument();

    // Resolve the lazy import
    await act(async () => {
      resolveLazy!({ default: () => <div>Lazy Loaded</div> });
    });

    expect(screen.getByText("Lazy Loaded")).toBeInTheDocument();
  });
});
