import { createRouter, publicQuery } from "./middleware.js";
import { authRouter } from "./routers/auth.js";
import { pegawaiRouter } from "./routers/pegawai.js";
import { absensiRouter } from "./routers/absensi.js";
import { cutiRouter } from "./routers/cuti.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  pegawai: pegawaiRouter,
  absensi: absensiRouter,
  cuti: cutiRouter,
});

export type AppRouter = typeof appRouter;
