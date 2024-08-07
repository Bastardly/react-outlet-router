# Disclaimer
Work in progress - Not ready for production - errors may occur

# React Outlet Router
React Outlet Router is a declarative client-side router, built with maintainability in mind. 

# Why use React Outlet Router?
-  React Outlet Router is only 5kb minified and g-zipped.
-  Declarative, everything can be defined in a single object, which provides a clear overview of the entire app.
-  Flexible enough to use string matching, params and even regex patterns.
-  Typesafe - 100% written in TypeScript
  
## Simple example

[View more complex example here](https://github.com/Bastardly/react-outlet-router/tree/main/example)

```TypeScript
import {
  RouterOutlet,
  useInitRouter,
  router,
} from "@flemminghansen/react-outlet-router";
import React from "react";
import ReactDOM from "react-dom/client";

function MockPage({ text }: {text: string}) {
    return <div>{text}</div>
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Router will be reinitialized on login. This way we can create a guard for the loggedin route.
  // For instance, the loggedin route and children won't be part of the routeTree until isLoggedIn is true.
  useInitRouter(
    {
    defaultPageTitle: "My simple router",
      default404Title: "404 - Page not found",
      defaultNotFoundComponent: () => <div>404 - Page not found</div>,
      fallback: <MockPage text="Please wait while we load your page dynamically..." />,
      routeTree: {
        "/": {
          component: MainPage,
        },
        "/loggedin": {
          removedIf: !isLoggedIn, 
          title: "Page one",
          component: () => <MockPage text="Welcome!!" />,
          children: {
            // loggedin/user
            "/user": { 
              title: "User page",
              component: () => <MockPage text="You are awesome!" />,
            },
          },
        },

        },
      },

    [isLoggedIn]
  );

  const handleLogin = () => {
    setIsLoggedIn(!isLoggedIn);

    if (!isLoggedIn) {
        router.replace('/loggedin')
    }
  }

  return (
    <>
        <button onClick={handleLogin}>
          {isLoggedIn ? "Log out" : "Log in"}
        </button>
      <RouterOutlet />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

# Installation
Installation is fairly simple using [Node's](https://nodejs.org) package manager.

In your cli, run:

```
npm install @flemminghansen/react-outlet-router
```

# What does React Outlet Router contain?
* useInitRouter - A hook that allows you to initialize and reinitialize your router based on dependencies.
* router - The Router object that's available after initialization. This will provide use with a range of utilities. 
* RouterOutlet - Where your best Route Match will be rendered.
* Link component - Allows you to navigate React Outlet Router without reloading the entire page.
* Redirect component - Can be used in the routeTree or as a component in your code to redirect your users on given criterias.

# useInitRouter
useInitRouter takes one object with the following keys as defined by the interface IRemappedInitRouterProps.

```TypeScript
interface IRemappedInitRouterProps {
  prefix?: string;
  defaultPageTitle: string;
  default404Title?: string;
  routeTree: Record<string, ILimitedRoute>; // key is the next part of the route, e.g. "/user"
  fallback: React.ReactNode;
  defaultNotFoundComponent: React.ComponentType<any>;
}

interface ILimitedRoute {
    component: React.ComponentType<any>;
    title?: string;
    fallback?: React.ReactNode;
    removedIf?: boolean;
    pattern?: RegExp;
    children?: Record<string, ILimitedRoute>;
}
```

## defaultPageTitle(required) 
Sets the document.title unless the routes specify something else

## default404Title(optional)
Defaults to: "404 - Page not found"

## defaultNotFoundComponent(required)
The component the router will render if there are no matches in the route tree.

## fallback(required)
The RouterOuter output is  wrapped in a [React Suspense Component](https://react.dev/reference/react/Suspense). The fallback is shown while a dynamically loaded page is loaded.

## prefix(optional)
Defaults to "/"

A part that will we prefixed to the pathname. This can be used if your domain hold multiple apps that lives under prefixes, such as:
* mydomain.com/myapp
* mydomain.com/mysecondapp

Then you can prefix each app with "/myapp" or "mysecondapp", and each app will prefix every route with that prefix, thereby keeping the scope.

## routeTree(required)
The routeTree is of type `Record<string, ILimitedRoute>;`, where the string is the path. 

Each path must be prefixed with "/" e.g. "/user" or "/blog"

You can then use children to expand paths as in this example where the path to `SettingsPage` will be `/user/settings`.

```TypeScript
        "/user": {
          title: "User Page",
          component: UserPage,
          children: {
            "/settings": { 
              title: "Settings page",
              component: SettingsPage,
            },
          },
        },
```

It's also possible to add params as a wildcard. These params can use used with the `router.getParams` method to allow the component to handle further rendering.
But is can also be used to create custom 404 pages, or automatically redirect the user to a different path.

Currently redirect is done with the Redirect component, but this may be added as an option to the route in the future. See example:

```TypeScript
        "/user": {
          title: "User Page",
          component: UserPage,
          children: {
            "/settings": { 
              title: "User settings",
              component: SettingsPage,
            },
            "/:invalid": { 
              component: () => <Redirect to="/user">, // This could also be a custom 404 page
            },
          },
        },
```

### Properties

#### component: React.ComponentType<any> - (required)
Sets the component that will be rendered at the RouterOutput if route is match.

#### pattern: RegExp - (optional)
Pattern overrides the given path for the route. It is recommended to use with a param e.g. `/:userid`, so that the value can be read with the `router.getParams` method.

```TypeScript
        "/user": {
          component: ParentPage,
          children: {
            "/:userid": {
              // pattern will match integers like /1234
              // but not strings like /123s
              pattern: new RegExp(/^\d+$/),
              component: UserPageForId, 
            },
          },
        },
```
In the above example, the userid must be an integer in order to match the pattern. 
* `/user/1234` == match
* `/user/1234s` == nomatch

Then in the `UserPageForId` component we use the `router.getParams` method to get the value.

```TypeScript
import React from "react";
import { router } from "@flemminghansen/react-outlet-router";

export function UserPageForId() {
  const { userid } = router.getParams();
  // Do magics with the userid which you know is an integer.
  ...
}
```

#### children: Record<string, ILimitedRoute> - (optional)
children is an object from which you can expand the route as described under routeTree 

#### title: string - (optional)
Sets `document.title` for the given route

#### fallback: React.ComponentType<any> - (optional)
Sets a fallback for the given route. If no component is passed, it defaults to the fallback you've set for the router.



work in progress

# Route to 1.0
1) Finish documentation.
2) Get 100% test coverage and harden code.
3) Clean up, and make it more readable.
4) Optimize.
5) JSDoc documentation in code for better developer experience.