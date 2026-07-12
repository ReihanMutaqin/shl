// import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
// import { appRouter } from "../../server/router.js";
// import { createContext } from "../../server/context.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: Request) {
  // TEST: return immediately to see if module loading hangs!
  return new Response(JSON.stringify({ status: "alive" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
