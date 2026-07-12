import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { pegawai } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const pegawaiRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    const allPegawai = await db.query.pegawai.findMany({
      orderBy: (pegawai, { desc }) => [desc(pegawai.createdAt)],
    });
    return allPegawai.map((p) => {
      const { password, ...rest } = p;
      return rest;
    });
  }),

  listActive: authedQuery.query(async () => {
    const db = getDb();
    const activePegawai = await db.query.pegawai.findMany({
      where: and(eq(pegawai.isHidden, false), eq(pegawai.role, "pegawai")),
      orderBy: (pegawai, { asc }) => [asc(pegawai.nama)],
    });
    return activePegawai.map((p) => {
      const { password, ...rest } = p;
      return rest;
    });
  }),

  getById: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const user = await db.query.pegawai.findFirst({
        where: eq(pegawai.id, input.id),
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Pegawai tidak ditemukan" });
      const { password, ...rest } = user;
      return rest;
    }),

  create: adminQuery
    .input(
      z.object({
        idPegawai: z.string().min(1, "ID Pegawai wajib diisi"),
        nama: z.string().min(1, "Nama wajib diisi"),
        jabatan: z.string().min(1, "Jabatan wajib diisi"),
        departemen: z.string().min(1, "Departemen wajib diisi"),
        password: z.string().min(4, "Password minimal 4 karakter"),
        role: z.enum(["pegawai", "admin"]).default("pegawai"),
        isHidden: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const existing = await db.query.pegawai.findFirst({
        where: eq(pegawai.idPegawai, input.idPegawai),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "ID Pegawai sudah terdaftar" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const result = await db.insert(pegawai).values({
        ...input,
        password: hashedPassword,
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        idPegawai: z.string().optional(),
        nama: z.string().optional(),
        jabatan: z.string().optional(),
        departemen: z.string().optional(),
        password: z.string().optional(),
        role: z.enum(["pegawai", "admin"]).optional(),
        isHidden: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const updateData: Record<string, unknown> = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      await db.update(pegawai).set(updateData).where(eq(pegawai.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(pegawai).where(eq(pegawai.id, input.id));
      return { success: true };
    }),

  stats: adminQuery.query(async () => {
    const db = getDb();
    const totalPegawai = await db
      .select({ count: sql<number>`count(*)` })
      .from(pegawai)
      .where(eq(pegawai.role, "pegawai"));
    const totalAdmin = await db
      .select({ count: sql<number>`count(*)` })
      .from(pegawai)
      .where(eq(pegawai.role, "admin"));
    return {
      totalPegawai: totalPegawai[0]?.count || 0,
      totalAdmin: totalAdmin[0]?.count || 0,
    };
  }),
});
