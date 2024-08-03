# React Outlet Router

React Outlet Router is a declarative client-side router, built with maintainability in mind. 

# Why use React Outlet Router?
-  React Outlet Router is only 5kb minified and g-zipped.
-  Declarative, everything can be defined in a single object, which provides a clear overview of the entire app.
-  Flexible enough to use string matching, params and even regex patterns.
-  Typesafe - 100% written in TypeScript
  
## Simple example

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