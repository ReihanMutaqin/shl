import { handle } from "hono/vercel";
import app from "../server/boot.js";
export default handle(app);
