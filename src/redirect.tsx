import React from "react";
import { router } from "./router";
import { IRedirect } from "./types";

export function Redirect({ to, push }: IRedirect) {
  React.useEffect(() => {
    if (push) {
      router.push({ pathname: to });
    } else {
      router.replace({ pathname: to });
    }
  }, [to, push]);

  return <span />;
}
