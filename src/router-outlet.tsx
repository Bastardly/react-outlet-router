import React, { Suspense } from "react";
import { router } from "./router";

export function RouterOutlet() {
  const [, setTimeStamp] = React.useState(0);

  React.useEffect(() => {
    router.register((timeStamp) => setTimeStamp(() => timeStamp));
  }, []);

  if (!router.isInitialized) {
    return router.fallback;
  }

  return (
    <Suspense fallback={router.fallback}>
      <router.Component />
    </Suspense>
  );
}
