// Vercel serverless function entry point
import { handle } from "hono/vercel";
import app from "../server/boot";

export default handle(app);

export const config = {
  runtime: "nodejs",
};
