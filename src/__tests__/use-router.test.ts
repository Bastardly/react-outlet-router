import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInitRouter } from "../use-router";
import { router } from "../router";

const Home = () => null;
const NotFound = () => null;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useInitRouter", () => {
  it("calls router.init() with correctly mapped props on mount", () => {
    const initSpy = vi.spyOn(router, "init");

    renderHook(() =>
      useInitRouter({
        routeTree: { "/": { component: Home } },
        defaultPageTitle: "Test",
        defaultNotFoundComponent: NotFound,
        fallback: null,
      }),
    );

    expect(initSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        limitedRouteTree: { "/": { component: Home } },
        defaultPageTitle: "Test",
        defaultNotFoundComponent: NotFound,
        fallback: null,
      }),
    );
  });

  it("re-calls router.init() when a dependency changes", () => {
    const initSpy = vi.spyOn(router, "init");

    const { rerender } = renderHook(
      ({ loggedIn }: { loggedIn: boolean }) =>
        useInitRouter(
          {
            routeTree: {
              "/": { component: Home },
              "/secret": { component: Home, removedIf: !loggedIn },
            },
            defaultPageTitle: "Test",
            defaultNotFoundComponent: NotFound,
            fallback: null,
          },
          [loggedIn],
        ),
      { initialProps: { loggedIn: false } },
    );

    expect(initSpy).toHaveBeenCalledTimes(1);

    rerender({ loggedIn: true });

    expect(initSpy).toHaveBeenCalledTimes(2);
  });

  it("does not re-call router.init() when dependencies are stable", () => {
    const initSpy = vi.spyOn(router, "init");

    const { rerender } = renderHook(() =>
      useInitRouter(
        {
          routeTree: { "/": { component: Home } },
          defaultPageTitle: "Test",
          defaultNotFoundComponent: NotFound,
          fallback: null,
        },
        [],
      ),
    );

    expect(initSpy).toHaveBeenCalledTimes(1);

    rerender();

    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it("returns the router singleton", () => {
    const { result } = renderHook(() =>
      useInitRouter({
        routeTree: { "/": { component: Home } },
        defaultPageTitle: "Test",
        defaultNotFoundComponent: NotFound,
        fallback: null,
      }),
    );

    expect(result.current).toBe(router);
  });
});
