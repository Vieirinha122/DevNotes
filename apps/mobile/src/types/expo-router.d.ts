// Declaration pro entry do expo-router (submodule sem .d.ts)
declare module "expo-router/entry" {
  import type { ReactNode } from "react";

  function registerRootComponent(component: () => ReactNode): void;

  export { registerRootComponent };
}
