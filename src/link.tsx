import React from "react";
import { router } from "./router";

interface LinkProps {
  children: React.ReactNode;
  to: string;
  className?: string;
  push?: boolean;
  title: string;
  hidden?: boolean;
}

export function Link({
  children,
  to,
  className,
  push,
  title,
  hidden,
}: LinkProps) {
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
