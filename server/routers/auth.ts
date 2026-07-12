import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { pegawai, sessions } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || "rs-shl-secret-key-2024"
);

async function createSessionToken(pegawaiId: number): Promise<string> {
  const token = await new SignJWT({ pegawaiId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
  return token;
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 60,
    });
    return payload as { pegawaiId: number };
  } catch {
    return null;
  }
}

export const authRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        idPegawai: z.string().min(1, "ID Pegawai wajib diisi"),
        password: z.string().min(1, "Password wajib diisi"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const user = await db.query.pegawai.findFirst({
        where: eq(pegawai.idPegawai, input.idPegawai),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ID Pegawai atau password salah",
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "ID Pegawai atau password salah",
        });
      }

      const token = await createSessionToken(user.id);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(sessions).values({
        token,
        pegawaiId: user.id,
        expiresAt,
      });

      // Clean up old password field from response
      const { password, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword,
      };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const token = getCookie(ctx.req.headers.get("cookie") || "", "session_token");
    if (token) {
      const db = getDb();
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    return { success: true };
  }),

  me: publicQuery.query(async ({ ctx }) => {
    const token = getCookie(ctx.req.headers.get("cookie") || "", "session_token");
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    const db = getDb();
    const user = await db.query.pegawai.findFirst({
      where: eq(pegawai.id, payload.pegawaiId),
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }),
});

function getCookie(cookieStr: string, name: string): string | undefined {
  const cookies = cookieStr.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return undefined;
}
