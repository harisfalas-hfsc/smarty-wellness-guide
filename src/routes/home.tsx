import { createFileRoute, redirect } from "@tanstack/react-router";

/** /home is an alias of the main Home experience at /. */
export const Route = createFileRoute("/home")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
