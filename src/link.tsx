import React from "react";
import { router } from "./router";
import { ILink } from "./types";

export function Link({ children, to, className, push, title, hidden }: ILink) {
  if (hidden) return null;

  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();

        return push
          ? router.push({ pathname: to })
          : router.replace({ pathname: to });
      }}
      className={className}
      title={title}
    >
      {children}
    </a>
  );
}
