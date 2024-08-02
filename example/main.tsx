import {
  Link,
  RouterOutlet,
  useInitRouter,
} from "@flemminghansen/react-outlet-router";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  MainPage,
  PageOne,
  PageTwo,
  BuggerOff,
  LazyPage,
  PageNotFound,
  PageOneSubpage,
  PageOneNotFound,
  PageRegex,
  PageRegexSuccess,
  PageRegexFailure,
} from "./pages";

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  useInitRouter(
    {
      routeTree: {
        "/": {
          component: MainPage,
        },
        "/one": {
          removedIf: !isLoggedIn,
          title: "Page one",
          component: PageOne,
          children: {
            "/subpage": {
              title: "Page one with subtitle",
              component: PageOneSubpage,
            },
            "/:404": {
              component: PageOneNotFound,
            },
          },
        },
        "/two": {
          component: PageTwo,
          children: {
            "/:myparam": {
              component: PageTwo, // We use params to manage content.
            },
          },
        },
        "/regex": {
          component: PageRegex,
          children: {
            "/:integer": {
              pattern: new RegExp(/^\d+$/), // will match integers like /1234 but not strings like /123s
              component: PageRegexSuccess, // We use regex that matches an integer to gate content.
            },
            "/:invalid": {
              component: PageRegexFailure, // We use regex that matches an integer to gate content.
            },
          },
        },
        "/bugger-off": {
          component: BuggerOff,
        },
        "/lazy": {
          removedIf: !isLoggedIn,
          component: LazyPage,
        },
      },
      defaultPageTitle: "My test router",
      default404Title: "404 - This is not the page you are looking for",
      defaultNotFoundComponent: PageNotFound,
      fallback: <div>Loading Page</div>,
    },
    [isLoggedIn]
  );

  return (
    <>
      <div style={{ display: "flex", columnGap: "12px" }}>
        <Link to="/" title="Go to main page">
          Main
        </Link>
        <Link to="/one" title="Returns to first page" hidden={!isLoggedIn}>
          Page one
        </Link>
        <Link to="/two" title="Returns to second page">
          Page two
        </Link>
        <Link to="/regex" title="Returns to second page">
          Regex gatekeeper
        </Link>
        <Link to="/bugger-off" title="Returns to main page">
          Redirect
        </Link>
        <Link
          to="/lazy"
          title="Returns to lazy loaded page"
          hidden={!isLoggedIn}
        >
          Lazy
        </Link>
        <button onClick={() => setIsLoggedIn(!isLoggedIn)}>
          {isLoggedIn ? "Log out" : "Log in"}
        </button>
      </div>
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
