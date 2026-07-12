import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { appRouter } from "../../server/router.js";
import { createContext } from "../../server/context.js";

export default async function handler(req: any, res: any) {
  // Extract the path after /api/trpc/
  const path = (req.url || "").split("?")[0].replace("/api/trpc/", "");
  
  return nodeHTTPRequestHandler({
    router: appRouter,
    createContext,
    req,
    res,
    path,
  });
}
