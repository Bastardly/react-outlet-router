type UpdateMethod = (shouldRender: boolean) => void;

interface IChangeLink {
  pathname: string;
  search?: string;
  hash?: string;
  data?: any;
}

export interface IRoute {
  component: React.ComponentType<any>;
  title?: string;
  fallback?: React.ReactNode;
  isActive: boolean;
  path: string;
  pattern?: RegExp;
  children?: Record<string, IRoute>;
}

interface LimitedRoute
  extends Pick<IRoute, "fallback" | "component" | "title" | "pattern"> {
  children?: Record<string, LimitedRoute>;
  removedIf?: boolean;
}

export type IRouteTree = Record<string, LimitedRoute>;

type IFullRouteTree = Record<string, IRoute>;

export interface IInitRouter {
  prefix?: string;
  origin?: string;
  defaultPageTitle: string;
  default404Title?: string;
  limitedRouteTree: IRouteTree;
  fallback: React.ReactNode;
  defaultNotFoundComponent: React.ComponentType<any>;
}

class RouterService {
  static paramPattern = /\/:(\w+)\??\/?/g; // flemming/was/:here/now/where/is/:bob?/ - Matches /:here?/ and /:bob?/

  static paramArrayPattern = /:(\w+)\??/g; // matches :here or :bob?

  static singleSlash = /\//g; // matches /

  static doubleSlash = /\/\//g; // matches //

  static invalid = "--invalid--";

  #dataState = new Map<string | URL, any>();

  #selectedPaths: string[] = [];

  #defaultPageTitle: string;

  #default404Title = "404 - Page not found";

  prefix = "/";

  origin = window.location.origin;

  url = new URL(window.location.href);

  previousUrl = new URL(window.location.href);

  #isInitialized = false;

  #routeTree: IFullRouteTree = {};

  #routePaths: string[] = [];

  Component: React.ComponentType<any> = () => null;

  defaultNotFoundComponent: React.ComponentType<any> = null;

  fallback: React.ReactNode;

  updateOutlet: (timeStamp: number) => void = null;

  constructor() {
    window.addEventListener("popstate", () => {
      if (!this.updateOutlet) return;

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
    this.#preInit();
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
    this.#isInitialized = true;
    this.#setBestRouteComponent();
  }

  register(updateOutlet: (timeStamp: number) => void) {
    if (this.updateOutlet) return;

    this.updateOutlet = updateOutlet;
    this.#setBestRouteComponent();
  }

  getPathName() {
    return this.#removePrefixFromPathName(this.url.pathname);
  }

  getParams() {
    const state: Record<string, string> = {};
    const parts = this.url.pathname.split("/").filter((v) => !!v.length);
    this.#selectedPaths.forEach((path, index) => {
      if (path.match(RouterService.paramPattern)) {
        state[path.slice(2)] = parts[index]; // removes /: from key
      }
    });
    return state;
  }

  push(values: IChangeLink | string, data?: any) {
    if (typeof values === "string") {
      this.#setUrlFromString(values);
      window.history.pushState(data, "", values);
    } else {
      const fullUrl = this.#getFullUrl(values);
      window.history.pushState(values.data, "", fullUrl);
    }

    if (data) {
      this.#dataState.set(this.url.pathname, data);
    }

    this.#setBestRouteComponent();
  }

  replace(values: IChangeLink | string, data?: any) {
    if (typeof values === "string") {
      this.#setUrlFromString(values);
      window.history.replaceState(data, "", values);
    } else {
      const fullUrl = this.#getFullUrl(values);
      window.history.replaceState(values.data, "", fullUrl);
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

  #preInit() {
    this.#isInitialized = false;
    this.#routePaths = [];
    this.#routeTree = {};
  }

  #validatePath(path: string) {
    if (path.match(RouterService.doubleSlash)) {
      // throw new Error(`Path ${path} is invalid: Path contains //`);
    }
    if (path[0] !== "/") {
      // throw new Error(`Path ${path} is invalid: All paths must a start with /`);
    }
  }

  #getRouteProperties(path: string, limitedRoute: LimitedRoute) {
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
      children: IRouteTree,
      fullParentPath: string
    ) => {
      if (!children || !parent) return {};

      if (!parent.children) {
        parent.children = {};
      }

      Object.entries(children).forEach(([path, limitedRoute]) => {
        if (limitedRoute.removedIf === true) return;

        const fullPath = fullParentPath + path;
        this.#routePaths.push(fullPath);
        parent.children[path] = {
          ...this.#getRouteProperties(path, limitedRoute),
          children: enhanceChildren(parent, limitedRoute.children, fullPath),
        };
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
        limitedRouteTree[path].children,
        path
      );
    });

    this.#routePaths = Array.from(new Set(this.#routePaths));
  }

  #setUrlFromString(path: string) {
    this.previousUrl = this.url;
    this.url = new URL(path, this.origin);
  }

  #removePrefixFromPathName(path: string) {
    return path
      .replace(this.prefix, "/")
      .replace(RouterService.doubleSlash, "/");
  }

  #setBestRouteComponent() {
    if (!this.updateOutlet || !this.#isInitialized) return;

    const { pathname } = this.url;

    if (pathname === "/") {
      this.Component = this.#routeTree["/"].component;

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
      const paths = Object.keys(childrenCopy).filter((path) => path !== "/");
      const shouldContinue = paths.some((path) => {
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

        if (currentPath.match(path)) {
          return returnValid();
        } else if (path.match(RouterService.paramArrayPattern)) {
          return returnValid();
        }

        return false;
      });

      if (shouldContinue) {
        this.Component = childrenCopy[currentMatch].component;

        nextTitle = childrenCopy[currentMatch].title || this.#defaultPageTitle;
        childrenCopy = childrenCopy[currentMatch].children;
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
    const fullPathName = this.#removePrefixFromPathName(pathname);
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