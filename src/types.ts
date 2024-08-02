import type { ReactNode } from "react";

export interface ILink {
  children: ReactNode;
  to: string;
  className?: string;
  push?: boolean;
  title: string;
  hidden?: boolean;
}

export interface IRedirect {
  to: string;
  push?: boolean;
}

export type IUpdateMethod = (shouldRender: boolean) => void; //*

export interface IChangeLink {
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

export interface ILimitedRoute
  extends Pick<IRoute, "fallback" | "component" | "title" | "pattern"> {
  children?: Record<string, ILimitedRoute>;
  removedIf?: boolean;
}

export type IRouteTree = Record<string, ILimitedRoute>;

export type IFullRouteTree = Record<string, IRoute>;

export interface IInitRouter {
  prefix?: string;
  origin?: string;
  defaultPageTitle: string;
  default404Title?: string;
  limitedRouteTree: IRouteTree;
  fallback: React.ReactNode;
  defaultNotFoundComponent: React.ComponentType<any>;
}

export interface IRemappedInitRouterProps
  extends Omit<IInitRouter, "limitedRouteTree"> {
  routeTree: IInitRouter["limitedRouteTree"];
}
