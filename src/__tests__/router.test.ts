import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { router } from "../router";

// Helper components
const Home = () => null;
const About = () => null;
const NotFound = () => null;
const Users = () => null;
const UserDetail = () => null;
const SubPage = () => null;
const DeepPage = () => null;
const RegexPage = () => null;

function initWithDefaults(
  routeTree: Parameters<typeof router.init>[0]["limitedRouteTree"],
  overrides: Partial<Parameters<typeof router.init>[0]> = {},
) {
  router.init({
    limitedRouteTree: routeTree,
    defaultPageTitle: "Test",
    defaultNotFoundComponent: NotFound,
    fallback: null,
    ...overrides,
  });
}

beforeEach(() => {
  // Register a mock outlet updater so setBestRouteComponent runs
  router.register(vi.fn());
});

afterEach(() => {
  router.unregister();
  // Reset URL to root
  window.history.replaceState(null, "", "/");
});

describe("RouterService", () => {
  describe("init()", () => {
    it("builds route tree from a flat config", () => {
      initWithDefaults({
        "/": { component: Home },
        "/about": { component: About },
      });

      expect(router.isInitialized).toBe(true);
    });

    it("builds route tree with children", () => {
      initWithDefaults({
        "/users": {
          component: Users,
          children: {
            "/:id": { component: UserDetail },
          },
        },
      });

      expect(router.isInitialized).toBe(true);
    });

    it("excludes routes with removedIf: true", () => {
      initWithDefaults({
        "/": { component: Home },
        "/secret": { component: About, removedIf: true },
      });

      // Navigate to /secret - should get NotFound
      window.history.replaceState(null, "", "/secret");
      router.push({ pathname: "/secret" });

      expect(router.Component).toBe(NotFound);
    });

    it("uses provided origin when building URLs", () => {
      initWithDefaults(
        {
          "/": { component: Home },
          "/about": { component: About },
        },
        { origin: "https://example.test" },
      );

      router.push("/about");

      expect(router.origin).toBe("https://example.test");
      expect(router.url.origin).toBe("https://example.test");
    });

    it("handles missing limitedRouteTree without crashing", () => {
      router.init({
        defaultPageTitle: "Test",
        defaultNotFoundComponent: NotFound,
        fallback: null,
        limitedRouteTree: undefined as unknown as Record<string, never>,
      });

      router.push({ pathname: "/missing" });

      expect(router.isInitialized).toBe(true);
      expect(router.Component).toBe(NotFound);
    });
  });

  describe("route matching", () => {
    it("matches exact path and sets correct component", () => {
      initWithDefaults({
        "/": { component: Home },
        "/about": { component: About },
      });

      router.push({ pathname: "/about" });

      expect(router.Component).toBe(About);
    });

    it("matches param path /:id", () => {
      initWithDefaults({
        "/users": {
          component: Users,
          children: {
            "/:id": { component: UserDetail },
          },
        },
      });

      router.push({ pathname: "/users/123" });

      expect(router.Component).toBe(UserDetail);
    });

    it("matches regex pattern correctly", () => {
      initWithDefaults({
        "/items": {
          component: Users,
          children: {
            "/:num": {
              pattern: /^\d+$/,
              component: RegexPage,
            },
            "/:fallback": {
              component: NotFound,
            },
          },
        },
      });

      router.push({ pathname: "/items/42" });

      expect(router.Component).toBe(RegexPage);

      router.push({ pathname: "/items/abc" });

      expect(router.Component).toBe(NotFound);
    });

    it("returns defaultNotFoundComponent for unmatched path", () => {
      initWithDefaults({
        "/": { component: Home },
      });

      router.push({ pathname: "/nonexistent" });

      expect(router.Component).toBe(NotFound);
    });

    it("matches root route /", () => {
      initWithDefaults({
        "/": { component: Home },
      });

      router.push({ pathname: "/" });

      expect(router.Component).toBe(Home);
    });

    it("handles missing root route without crash (T-003)", () => {
      initWithDefaults({
        "/about": { component: About },
      });

      router.push({ pathname: "/" });

      expect(router.Component).toBe(NotFound);
    });

    it("matches deeply nested routes correctly (T-001)", () => {
      initWithDefaults({
        "/one": {
          component: Users,
          children: {
            "/sub": {
              component: SubPage,
              children: {
                "/deep": { component: DeepPage },
              },
            },
          },
        },
      });

      router.push({ pathname: "/one/sub/deep" });

      expect(router.Component).toBe(DeepPage);
    });

    it("uses strict equality, not regex match (T-006)", () => {
      initWithDefaults({
        "/a": { component: Home },
        "/ab": { component: About },
      });

      router.push({ pathname: "/ab" });

      expect(router.Component).toBe(About);
    });

    it("excludes child routes with removedIf: true", () => {
      initWithDefaults({
        "/users": {
          component: Users,
          children: {
            "/list": { component: SubPage, removedIf: true },
            "/active": { component: About },
          },
        },
      });

      router.push({ pathname: "/users/list" });
      expect(router.Component).toBe(NotFound);

      router.push({ pathname: "/users/active" });
      expect(router.Component).toBe(About);
    });
  });

  describe("getParams()", () => {
    it("extracts param values from matched path", () => {
      initWithDefaults({
        "/users": {
          component: Users,
          children: {
            "/:id": { component: UserDetail },
          },
        },
      });

      router.push({ pathname: "/users/456" });

      const params = router.getParams();
      expect(params).toEqual({ id: "456" });
    });

    it("strips trailing ? from optional param keys (T-002)", () => {
      initWithDefaults({
        "/items": {
          component: Users,
          children: {
            "/:id?": { component: UserDetail },
          },
        },
      });

      router.push({ pathname: "/items/789" });

      const params = router.getParams();
      expect(params.id).toBe("789");
      expect(params["id?"]).toBeUndefined();
    });
  });

  describe("push() and replace()", () => {
    it("push() updates router.url", () => {
      initWithDefaults({ "/": { component: Home } });

      const pushStateSpy = vi.spyOn(window.history, "pushState");

      router.push({ pathname: "/about" });

      expect(router.url.pathname).toBe("/about");
      expect(pushStateSpy).toHaveBeenCalled();

      pushStateSpy.mockRestore();
    });

    it("replace() updates router.url and calls replaceState", () => {
      initWithDefaults({ "/": { component: Home } });

      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      router.replace({ pathname: "/about" });

      expect(router.url.pathname).toBe("/about");
      expect(replaceStateSpy).toHaveBeenCalled();

      replaceStateSpy.mockRestore();
    });

    it("push() with string argument works", () => {
      initWithDefaults({ "/": { component: Home } });

      const pushStateSpy = vi.spyOn(window.history, "pushState");

      router.push("/about");

      expect(router.url.pathname).toBe("/about");
      expect(pushStateSpy).toHaveBeenCalled();

      pushStateSpy.mockRestore();
    });

    it("replace() with string argument works", () => {
      initWithDefaults({ "/": { component: Home } });

      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      router.replace("/about");

      expect(router.url.pathname).toBe("/about");
      expect(replaceStateSpy).toHaveBeenCalled();

      replaceStateSpy.mockRestore();
    });
  });

  describe("getUrlData()", () => {
    it("retrieves stored data for a URL", () => {
      initWithDefaults({ "/": { component: Home } });

      router.push({ pathname: "/test" }, { foo: "bar" });

      const data = router.getUrlData("/test");
      expect(data).toEqual({ foo: "bar" });
    });

    it("clears data when clear flag is true", () => {
      initWithDefaults({ "/": { component: Home } });

      router.push({ pathname: "/test" }, { foo: "bar" });

      const data = router.getUrlData("/test", true);
      expect(data).toEqual({ foo: "bar" });

      const cleared = router.getUrlData("/test");
      expect(cleared).toBeUndefined();
    });

    it("returns all stored URL data keys", () => {
      initWithDefaults({ "/": { component: Home } });

      router.push({ pathname: "/first" }, { id: 1 });
      router.push({ pathname: "/second" }, { id: 2 });

      const keys = Array.from(router.getUrlDataKeys());

      expect(keys).toContain("/first");
      expect(keys).toContain("/second");
    });
  });

  describe("popstate listener", () => {
    it("updates selected route on popstate when outlet is registered", () => {
      initWithDefaults({
        "/": { component: Home },
        "/about": { component: About },
      });

      const updateSpy = vi.fn();
      router.register(updateSpy);

      window.history.pushState(null, "", "/about");
      window.dispatchEvent(new PopStateEvent("popstate"));

      expect(updateSpy).toHaveBeenCalled();
      expect(router.Component).toBe(About);
      expect(router.location.pathname).toBe("/about");
    });

    it("returns early on popstate when outlet is not registered", () => {
      initWithDefaults({
        "/": { component: Home },
        "/about": { component: About },
      });

      router.push({ pathname: "/" });
      router.unregister();

      window.history.pushState(null, "", "/about");

      expect(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      }).not.toThrow();
      expect(router.location.pathname).toBe("/");
    });
  });

  describe("prefix handling", () => {
    it("strips prefix from pathnames", () => {
      initWithDefaults(
        {
          "/": { component: Home },
          "/page": { component: About },
        },
        { prefix: "/app" },
      );

      expect(router.getPathName()).toBeDefined();
    });

    it("prefix removal is anchored to start (T-005)", () => {
      initWithDefaults(
        {
          "/": { component: Home },
        },
        { prefix: "/app" },
      );

      // Manually check the getPathName behavior
      // The prefix /app should only be stripped from the beginning
      router.push({ pathname: "/page" });
      const pathName = router.getPathName();
      expect(pathName).toBe("/page");
    });
  });

  describe("getPathName()", () => {
    it("returns pathname without prefix", () => {
      initWithDefaults({ "/": { component: Home } }, { prefix: "/app" });

      router.push({ pathname: "/test" });

      expect(router.getPathName()).toBe("/test");
    });

    it("exposes current URL through location getter", () => {
      initWithDefaults({ "/": { component: Home } });

      router.push({ pathname: "/test" });

      expect(router.location).toBe(router.url);
      expect(router.location.pathname).toBe("/test");
    });
  });

  describe("path validation warnings", () => {
    it("warns when route path is malformed", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      initWithDefaults({
        "bad//path": { component: Home },
      } as Record<string, { component: typeof Home }>);

      const messages = warnSpy.mock.calls.map(([message]) => String(message));

      expect(
        messages.some((message) =>
          message.includes('contains "//". This may cause unexpected matching behavior.'),
        ),
      ).toBe(true);
      expect(
        messages.some((message) =>
          message.includes('does not start with "/". All paths must start with /.'),
        ),
      ).toBe(true);

      warnSpy.mockRestore();
    });
  });

  describe("document.title management", () => {
    it("sets document.title from route title", () => {
      initWithDefaults({
        "/": { component: Home },
        "/about": { component: About, title: "About Us" },
      });

      router.push({ pathname: "/about" });

      expect(document.title).toBe("About Us");
    });

    it("sets 404 title for unmatched routes", () => {
      initWithDefaults(
        { "/": { component: Home } },
        { default404Title: "Custom 404" },
      );

      router.push({ pathname: "/nowhere" });

      expect(document.title).toBe("Custom 404");
    });

    it("builds full URL with search and hash", () => {
      initWithDefaults({
        "/": { component: Home },
        "/about": { component: About },
      });

      const pushStateSpy = vi.spyOn(window.history, "pushState");

      router.push({
        pathname: "/about",
        search: "?tab=info",
        hash: "#summary",
      });

      expect(router.url.pathname).toBe("/about");
      expect(router.url.search).toBe("?tab=info");
      expect(router.url.hash).toBe("#summary");
      expect(pushStateSpy).toHaveBeenCalledWith(
        undefined,
        "",
        "/about?tab=info#summary",
      );

      pushStateSpy.mockRestore();
    });
  });
});
