import React from "react";
import { IInitRouter, router } from "./router";

interface IRemappedInitRouterProps
  extends Omit<IInitRouter, "limitedRouteTree"> {
  routeTree: IInitRouter["limitedRouteTree"];
}

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
