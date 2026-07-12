import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";
import { getDb } from "./queries/connection.js";
import { sessions } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

// Authed procedure - checks session from cookie
export const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  const cookieHeader = typeof ctx.req.headers.get === "function" 
    ? ctx.req.headers.get("cookie") 
    : (ctx.req.headers as any).cookie;
  const token = getCookie(cookieHeader || "", "session_token");

  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi tidak valid" });
  }

  const db = getDb();
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())),
    with: {
      pegawai: true,
    },
  });

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi telah kadaluarsa" });
  }

  return next({
    ctx: {
      ...ctx,
      user: session.pegawai,
    },
  });
});

// Admin procedure - checks session + admin role
export const adminQuery = t.procedure.use(async ({ ctx, next }) => {
  const cookieHeader = typeof ctx.req.headers.get === "function" 
    ? ctx.req.headers.get("cookie") 
    : (ctx.req.headers as any).cookie;
  const token = getCookie(cookieHeader || "", "session_token");

  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi tidak valid" });
  }

  const db = getDb();
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())),
    with: {
      pegawai: true,
    },
  });

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi telah kadaluarsa" });
  }

  if (session.pegawai.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak" });
  }

  return next({
    ctx: {
      ...ctx,
      user: session.pegawai,
    },
  });
});

function getCookie(cookieStr: string, name: string): string | undefined {
  const cookies = cookieStr.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return undefined;
}
