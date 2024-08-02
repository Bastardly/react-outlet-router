import React from "react";
import { router } from "./router";
import type { IRemappedInitRouterProps } from "./types";

export const useInitRouter = (
  props: IRemappedInitRouterProps,
  dependencies?: any[]
) => {
  React.useEffect(() => {
    router.init({
      prefix: props.prefix,
      origin: props.origin,
      limitedRouteTree: props.routeTree,
      fallback: props.fallback,
      defaultNotFoundComponent: props.defaultNotFoundComponent,
      defaultPageTitle: props.defaultPageTitle,
      default404Title: props.default404Title,
    });
  }, dependencies || []);

  return router;
};
