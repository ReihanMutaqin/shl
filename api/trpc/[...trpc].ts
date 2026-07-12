import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "../../server/router.js";
import { createContext } from "../../server/context.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default createNextApiHandler({
  router: appRouter,
  createContext,
});
