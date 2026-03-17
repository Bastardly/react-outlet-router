import React from "react";
import { router } from "./router";
import { ILink } from "./types";

export function Link({ children, to, className, push, title, hidden }: ILink) {
  if (hidden) return null;

  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;

        e.preventDefault();

        push ? router.push({ pathname: to }) : router.replace({ pathname: to });
      }}
      className={className}
      title={title}
    >
      {children}
    </a>
  );
}
