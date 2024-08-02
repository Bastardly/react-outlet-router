import React from "react";
import { Link, Redirect, router } from "@flemminghansen/react-outlet-router";

export function MainPage() {
  return <div>I am the main page</div>;
}

export function PageOne() {
  return (
    <div>
      I am page 1, now go to my sub page: <br />
      <Link to="/one/subpage" title="Go to the subpage. There be dragons!">
        Link to my subpage!
      </Link>
      <br />
      <Link to="/one/invalid" title="This link is invalid!">
        Go to invalid link
      </Link>
    </div>
  );
}

export function PageOneSubpage() {
  return <div>I am the subpage for page 1</div>;
}

export function PageNotFound() {
  return <div>DEFAULT 404 - PAGE NOT FOUND </div>;
}

export function PageOneNotFound() {
  return <div>404 - CUSTOM PAGE NOT FOUND FOR PAGE 1</div>;
}

export function PageTwo() {
  const { myparam } = router.getParams();

  if (myparam) {
    return <div>I am page 2 with the param number: {myparam}</div>;
  }

  const random = Math.floor(Math.random() * 100000);
  const randomLinkWithParam = `/two/${random}`;

  return (
    <div>
      I am page 2
      <br />
      <Link to={randomLinkWithParam} title="Go to page with param">
        Go to a page with random param
      </Link>
    </div>
  );
}

export function PageRegex() {
  return (
    <div>
      Page with subpages matched by regex
      <br />
      <Link to="/regex/1234" title="Go to page with valid param">
        Go to a page where subpage has an integer as param (valid)
      </Link>
      <br />
      <Link to="/regex/123s" title="Go to page with invalid param">
        Go to a page where subpage has an invalid param (invalid = 404)
      </Link>
    </div>
  );
}

export function PageRegexSuccess() {
  const { integer } = router.getParams();

  return (
    <div>
      Great success: '{integer}' is an integer that matches the regex. /^\d+$/
    </div>
  );
}

export function PageRegexFailure() {
  const { invalid } = router.getParams();

  return (
    <div>
      Invalid param: '{invalid}' is not an integer, and does not match the
      regex. /^\d+$/
    </div>
  );
}

export function BuggerOff() {
  return <Redirect to="/" />;
}

export const LazyPage = React.lazy(() => import("./lazy-page"));
