import {
  IRouteTree,
  IFullRouteTree,
  IChangeLink,
  ILimitedRoute,
  IRoute,
  IInitRouter,
} from "./types";

class RouterService {
  static paramPattern = /\/:(\w+)\??\/?/g; // flemming/was/:here/now/where/is/:bob?/ - Matches /:here?/ and /:bob?/

  static paramArrayPattern = /:(\w+)\??/g; // matches :here or :bob?

  static singleSlash = /\//g; // matches /

  static doubleSlash = /\/\//g; // matches //

  static invalid = "--invalid--";

  #dataState = new Map<string | URL, unknown>();

  #selectedPaths: string[] = [];

  #defaultPageTitle = "";

  #default404Title = "404 - Page not found";

  prefix = "/";

  //  todo remove?
  origin = window.location.origin;

  url = new URL(window.location.href);

  previousUrl = new URL(window.location.href);

  isInitialized = false;

  #routeTree: IFullRouteTree = {};

  #routePaths: string[] = [];

  Component: React.ComponentType<object> = () => null;

  // @ts-expect-error - We set it in init
  defaultNotFoundComponent: React.ComponentType<object> = null;

  fallback: React.ReactNode;

  // @ts-expect-error - We set it in init
  updateOutlet: (timeStamp: number) => void = null;

  constructor() {
    window.addEventListener("popstate", () => {
      if (!this.updateOutlet) return;

      this.previousUrl = this.url;
      this.url = new URL(window.location.href);

      this.#setBestRouteComponent();
    });
  }

  get location() {
    return this.url;
  }

  init({
    prefix,
    origin,
    limitedRouteTree,
    fallback,
    defaultNotFoundComponent,
    defaultPageTitle,
    default404Title,
  }: IInitRouter) {
    this.isInitialized = false;
    this.#routePaths = [];
    this.#routeTree = {};
    this.prefix = prefix ?? "";
    this.defaultNotFoundComponent = defaultNotFoundComponent;
    this.#defaultPageTitle = defaultPageTitle;

    if (default404Title) {
      this.#default404Title = default404Title;
    }

    if (origin) {
      this.origin = origin;
    }

    if (fallback) {
      this.fallback = fallback;
    }

    this.#createRouteTree(limitedRouteTree);
    this.isInitialized = true;

    this.#setBestRouteComponent();
  }

  register(updateOutlet: (timeStamp: number) => void) {
    this.updateOutlet = updateOutlet;

    this.#setBestRouteComponent();
  }

  unregister() {
    // @ts-expect-error - Reset to null for cleanup
    this.updateOutlet = null;
  }

  /**
   * Get pathname without prefix
   * @returns string
   */
  getPathName() {
    return this.#removePrefixFromPathName(this.url.pathname);
  }

  getParams() {
    const state: Record<string, string> = {};
    const pathname = this.#removePrefixFromPathName(this.url.pathname);
    const parts = pathname.split("/").filter((v) => !!v.length);
    this.#selectedPaths.forEach((path, index) => {
      if (path.match(RouterService.paramPattern)) {
        state[path.slice(2).replace(/\?$/, "")] = parts[index]; // removes /: and trailing ? from key
      }
    });
    return state;
  }

  push(values: IChangeLink | string, data?: unknown) {
    this.#navigate(values, true, data);
  }

  replace(values: IChangeLink | string, data?: unknown) {
    this.#navigate(values, false, data);
  }

  #navigate(values: IChangeLink | string, push: boolean, data?: unknown) {
    if (typeof values === "string") {
      this.#setUrlFromString(values);
      const normalizedUrl = this.url.pathname + this.url.search + this.url.hash;
      if (push) {
        window.history.pushState(data, "", normalizedUrl);
      } else {
        window.history.replaceState(data, "", normalizedUrl);
      }
    } else {
      const fullUrl = this.#getFullUrl(values);
      if (push) {
        window.history.pushState(values.data, "", fullUrl);
      } else {
        window.history.replaceState(values.data, "", fullUrl);
      }
    }

    if (data) {
      this.#dataState.set(this.url.pathname, data);
    }
    this.#setBestRouteComponent();
  }

  getUrlData(url: string | URL, clear?: boolean) {
    const data = this.#dataState.get(url);

    if (clear) {
      this.#dataState.delete(url);
    }

    return data;
  }

  getUrlDataKeys() {
    return this.#dataState.keys();
  }

  #validatePath(path: string) {
    if (path.match(RouterService.doubleSlash)) {
      console.warn(
        `Route path "${path}" contains "//". This may cause unexpected matching behavior.`,
      );
    }
    if (path[0] !== "/") {
      console.warn(
        `Route path "${path}" does not start with "/". All paths must start with /.`,
      );
    }
  }

  #getRouteProperties(path: string, limitedRoute: ILimitedRoute) {
    this.#validatePath(path);

    return {
      path,
      title: limitedRoute.title,
      pattern: limitedRoute.pattern,
      component: limitedRoute.component,
      isActive: false,
    };
  }

  #createRouteTree(limitedRouteTree?: IRouteTree) {
    if (!limitedRouteTree) return;

    const enhanceChildren = (
      parent: IRoute,
      fullParentPath: string,
      children?: IRouteTree,
    ) => {
      if (!children || !parent) return {};

      if (!parent.children) {
        parent.children = {};
      }

      Object.entries(children).forEach(([path, limitedRoute]) => {
        if (limitedRoute.removedIf === true) return;

        const fullPath = fullParentPath + path;
        this.#routePaths.push(fullPath);

        const childRoute: IRoute = {
          ...this.#getRouteProperties(path, limitedRoute),
          children: {},
        };

        enhanceChildren(childRoute, fullPath, limitedRoute.children);

        parent.children![path] = childRoute;
      });
    };

    Object.keys(limitedRouteTree).forEach((path) => {
      if (limitedRouteTree[path].removedIf === true) return;

      this.#routePaths.push(path);
      this.#routeTree[path] = {
        ...this.#getRouteProperties(path, limitedRouteTree[path]),
      };

      enhanceChildren(
        this.#routeTree[path],
        path,
        limitedRouteTree[path].children,
      );
    });

    this.#routePaths = Array.from(new Set(this.#routePaths));
  }

  #setUrlFromString(path: string) {
    this.previousUrl = this.url;
    const fullPath = this.prefix + this.#removePrefixFromPathName(path);
    this.url = new URL(fullPath, this.origin);
  }

  #removePrefixFromPathName(path: string) {
    if (this.prefix && path.startsWith(this.prefix)) {
      path = "/" + path.slice(this.prefix.length);
    }
    return path.replace(RouterService.doubleSlash, "/");
  }

  #setBestRouteComponent() {
    if (!this.updateOutlet || !this.isInitialized) return;

    const pathname = this.#removePrefixFromPathName(this.url.pathname);

    if (pathname === "/") {
      const rootRoute = this.#routeTree["/"];

      if (!rootRoute) {
        this.Component = this.defaultNotFoundComponent;
        document.title = this.#default404Title;
        return this.updateOutlet(new Date().getTime());
      }

      this.Component = rootRoute.component;

      return this.updateOutlet(new Date().getTime());
    }

    const routerPaths = pathname
      .split("/")
      .filter((path) => !!path.length)
      .map((path) => "/" + path);
    let childrenCopy = this.#routeTree;
    let currentMatch = RouterService.invalid;
    let nextTitle = this.#defaultPageTitle;
    let hasMatch = true;
    this.#selectedPaths = [];

    for (let i = 0; i < routerPaths.length; i++) {
      const currentPath = routerPaths[i];
      currentMatch = RouterService.invalid;

      // O(1) exact-match lookup before iterating all keys
      const exactRoute = childrenCopy[currentPath];
      if (exactRoute && !exactRoute.pattern) {
        this.#selectedPaths.push(currentPath);
        currentMatch = currentPath;
      }

      const shouldContinue =
        currentMatch !== RouterService.invalid ||
        (() => {
          const paths = Object.keys(childrenCopy).filter(
            (path) => path !== "/",
          );
          return paths.some((path) => {
            const route = childrenCopy[path];
            const returnValid = () => {
              this.#selectedPaths.push(path);
              currentMatch = path;
              return true;
            };

            if (route.pattern) {
              const sliced = currentPath.slice(1); // remove '/'

              return sliced.match(route.pattern) ? returnValid() : false;
            }

            if (path.match(RouterService.paramArrayPattern)) {
              return returnValid();
            }

            return false;
          });
        })();

      if (shouldContinue) {
        this.Component = childrenCopy[currentMatch].component;

        nextTitle = childrenCopy[currentMatch].title || this.#defaultPageTitle;
        childrenCopy = childrenCopy[currentMatch].children || {};
        continue;
      } else {
        hasMatch = false;
        break;
      }
    }

    if (!hasMatch) {
      this.Component = this.defaultNotFoundComponent;
      document.title = this.#default404Title;
    } else {
      document.title = nextTitle;
    }

    this.updateOutlet(new Date().getTime());
  }

  #getFullUrl({ pathname, hash, search }: IChangeLink) {
    const fullPathName = this.prefix + this.#removePrefixFromPathName(pathname);
    const url = new URL(fullPathName, this.origin);

    if (search) {
      url.search = search;
    }

    if (hash) {
      url.hash = hash;
    }

    const fullUrl = url.pathname + url.search + url.hash;

    this.previousUrl = this.url;
    // We fully replace the old URL
    this.url = url;

    return fullUrl;
  }
}

export const router = new RouterService();
