import { Hono } from "hono";

import { cors } from "hono/cors";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";

const app = new Hono<{ Bindings: HttpBindings }>();

app.get("/api/test", (c) => {
  return c.json({ status: "hono is alive" });
});

app.use(cors({
  origin: env.isProduction ? undefined : "http://localhost:3000",
  credentials: true,
}));



app.get("/api/test", (c) => {
  return c.json({ status: "alive" });
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// Standalone server removed for Vercel compatibility
// if (env.isProduction && !process.env.VERCEL) {
//   const { serve } = await import("@hono/node-server");
//   const { serveStaticFiles } = await import("./lib/vite.js");
//   serveStaticFiles(app);
// 
//   const port = parseInt(process.env.PORT || "3000");
//   serve({ fetch: app.fetch, port }, () => {
//     console.log(`Server running on http://localhost:${port}/`);
//   });
// }
