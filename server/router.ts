import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { pegawaiRouter } from "./routers/pegawai";
import { absensiRouter } from "./routers/absensi";
import { cutiRouter } from "./routers/cuti";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  pegawai: pegawaiRouter,
  absensi: absensiRouter,
  cuti: cutiRouter,
});

export type AppRouter = typeof appRouter;
