/* eslint-disable react/jsx-props-no-spreading */
import React, { Suspense } from "react";
import { router } from "./router";

export function RouterOutlet() {
  const [, setTimeStamp] = React.useState(0);

  React.useEffect(() => {
    router.register((timeStamp) => setTimeStamp(() => timeStamp));
  }, []);

  return (
    <Suspense fallback={router.fallback}>
      <router.Component />
    </Suspense>
  );
}
