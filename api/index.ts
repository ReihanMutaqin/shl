// Vercel serverless function entry point
import { handle } from "hono/vercel";
import app from "../server/boot.js";

export default handle(app);

export const config = {
  runtime: "nodejs",
};
