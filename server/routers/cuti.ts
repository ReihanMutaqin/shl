import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { cuti } from "@db/schema";
import { eq, sql, desc } from "drizzle-orm";

export const cutiRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
        tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
        jenis: z.enum(["tahunan", "sakit", "melahirkan", "penting"]),
        alasan: z.string().min(5, "Alasan minimal 5 karakter"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const result = await db.insert(cuti).values({
        pegawaiId: ctx.user.id,
        tanggalMulai: new Date(input.tanggalMulai),
        tanggalSelesai: new Date(input.tanggalSelesai),
        jenis: input.jenis,
        alasan: input.alasan,
        status: "pending",
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  getByPegawai: authedQuery
    .input(z.object({ pegawaiId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const pid = input.pegawaiId || ctx.user.id;

      if (ctx.user.role !== "admin" && pid !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak" });
      }

      const data = await db.query.cuti.findMany({
        where: eq(cuti.pegawaiId, pid),
        orderBy: [desc(cuti.createdAt)],
        with: {
          pegawai: true,
          approver: true,
        },
      });

      return data;
    }),

  getAll: adminQuery
    .input(
      z.object({
        status: z.enum(["pending", "disetujui", "ditolak"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let conditions = undefined;
      if (input.status) {
        conditions = eq(cuti.status, input.status);
      }

      const data = await db.query.cuti.findMany({
        where: conditions,
        orderBy: [desc(cuti.createdAt)],
        with: {
          pegawai: true,
          approver: true,
        },
      });

      return data;
    }),

  approve: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["disetujui", "ditolak"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(cuti)
        .set({
          status: input.status,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        })
        .where(eq(cuti.id, input.id));

      return { success: true };
    }),

  stats: adminQuery.query(async () => {
    const db = getDb();

    const pending = await db
      .select({ count: sql<number>`count(*)` })
      .from(cuti)
      .where(eq(cuti.status, "pending"));

    const disetujui = await db
      .select({ count: sql<number>`count(*)` })
      .from(cuti)
      .where(eq(cuti.status, "disetujui"));

    const ditolak = await db
      .select({ count: sql<number>`count(*)` })
      .from(cuti)
      .where(eq(cuti.status, "ditolak"));

    return {
      pending: pending[0]?.count || 0,
      disetujui: disetujui[0]?.count || 0,
      ditolak: ditolak[0]?.count || 0,
    };
  }),
});
