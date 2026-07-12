import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { absensi } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

const SHIFT_JAM_MASUK: Record<string, string> = {
  pagi: "08:00",
  siang: "14:00",
  malam: "21:00",
  "pagi+siang": "08:00",
  "siang+malam": "14:00",
  "malam+pagi": "21:00",
};

function getStatusAbsensi(shift: string, jamMasuk: Date): { status: "hadir" | "terlambat", keterangan: string | null, isTooEarly: boolean } {
  const jamMasukStr = SHIFT_JAM_MASUK[shift];
  if (!jamMasukStr) return { status: "hadir", keterangan: null, isTooEarly: false };

  const [jam, menit] = jamMasukStr.split(":").map(Number);
  const batas = new Date(jamMasuk);
  batas.setHours(jam, menit, 0, 0);

  const diffMs = jamMasuk.getTime() - batas.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < -30) {
    return { status: "hadir", keterangan: null, isTooEarly: true };
  }

  if (diffMins > 0) {
    return {
      status: "terlambat",
      keterangan: `Terlambat ${diffMins} menit`,
      isTooEarly: false,
    };
  }

  return { status: "hadir", keterangan: null, isTooEarly: false };
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function dateBetweenSql(bulan: number, tahun: number) {
  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-31`;
  return sql`${absensi.tanggal} BETWEEN ${startDate} AND ${endDate}`;
}

export const absensiRouter = createRouter({
  checkIn: authedQuery
    .input(
      z.object({
        shift: z.enum(["pagi", "siang", "malam", "pagi+siang", "siang+malam", "malam+pagi"]),
        fotoMasuk: z.string().min(1, "Foto wajib diambil"),
        lokasiMasuk: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const pegawaiId = ctx.user.id;
      const now = new Date();
      const today = getTodayStr();

      // Get the latest check-in for today
      const existing = await db.query.absensi.findFirst({
        where: and(
          eq(absensi.pegawaiId, pegawaiId),
          sql`DATE(${absensi.tanggal}) = ${today}`
        ),
        orderBy: (absensi, { desc }) => [desc(absensi.jamMasuk)],
      });

      if (existing && !existing.jamKeluar) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Anda harus absen keluar terlebih dahulu sebelum absen masuk lagi",
        });
      }

      const absenStatus = getStatusAbsensi(input.shift, now);

      if (absenStatus.isTooEarly) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Belum bisa absen. Anda hanya bisa absen paling cepat 30 menit sebelum shift dimulai.",
        });
      }

      const result = await db.insert(absensi).values({
        pegawaiId,
        tanggal: new Date(today),
        shift: input.shift,
        jamMasuk: now,
        fotoMasuk: input.fotoMasuk,
        lokasiMasuk: input.lokasiMasuk || null,
        status: absenStatus.status,
        keterangan: absenStatus.keterangan,
      });

      return {
        success: true,
        absensi: {
          id: Number(result[0].insertId),
          pegawaiId,
          tanggal: today,
          shift: input.shift,
          jamMasuk: now,
          status: absenStatus.status,
          keterangan: absenStatus.keterangan,
        },
      };
    }),

  checkOut: authedQuery
    .input(
      z.object({
        fotoKeluar: z.string().min(1, "Foto wajib diambil"),
        lokasiKeluar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const pegawaiId = ctx.user.id;
      const now = new Date();
      const today = getTodayStr();

      const existing = await db.query.absensi.findFirst({
        where: and(
          eq(absensi.pegawaiId, pegawaiId),
          sql`DATE(${absensi.tanggal}) = ${today}`
        ),
        orderBy: (absensi, { desc }) => [desc(absensi.jamMasuk)],
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Anda belum absen masuk hari ini",
        });
      }

      if (existing.jamKeluar) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Anda sudah absen keluar hari ini",
        });
      }

      await db
        .update(absensi)
        .set({
          jamKeluar: now,
          fotoKeluar: input.fotoKeluar,
          lokasiKeluar: input.lokasiKeluar || null,
        })
        .where(eq(absensi.id, existing.id));

      return {
        success: true,
        absensi: {
          ...existing,
          jamKeluar: now,
        },
      };
    }),

  getToday: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const today = getTodayStr();

    const data = await db.query.absensi.findFirst({
      where: and(
        eq(absensi.pegawaiId, ctx.user.id),
        sql`DATE(${absensi.tanggal}) = ${today}`
      ),
      orderBy: (absensi, { desc }) => [desc(absensi.jamMasuk)],
    });

    return data || null;
  }),

  getByPegawai: authedQuery
    .input(
      z.object({
        pegawaiId: z.number().optional(),
        bulan: z.number().min(1).max(12).optional(),
        tahun: z.number().min(2020).max(2100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const pid = input.pegawaiId || ctx.user.id;

      // Non-admin can only view their own
      if (ctx.user.role !== "admin" && pid !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak" });
      }

      const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof sql>> = [
        eq(absensi.pegawaiId, pid),
      ];

      if (input.bulan && input.tahun) {
        conditions.push(dateBetweenSql(input.bulan, input.tahun));
      }

      const data = await db.query.absensi.findMany({
        where: and(...conditions),
        orderBy: (absensi, { desc }) => [desc(absensi.tanggal)],
        with: {
          pegawai: true,
        },
      });

      return data;
    }),

  getAll: adminQuery
    .input(
      z.object({
        bulan: z.number().min(1).max(12).optional(),
        tahun: z.number().min(2020).max(2100).optional(),
        departemen: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions: Array<ReturnType<typeof sql>> = [];

      if (input.bulan && input.tahun) {
        conditions.push(dateBetweenSql(input.bulan, input.tahun));
      }

      const data = await db.query.absensi.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (absensi, { desc }) => [desc(absensi.tanggal), desc(absensi.jamMasuk)],
        with: {
          pegawai: true,
        },
      });

      if (input.departemen) {
        return data.filter((d) => d.pegawai?.departemen === input.departemen);
      }

      return data;
    }),

  getStats: adminQuery
    .input(
      z.object({
        bulan: z.number().min(1).max(12),
        tahun: z.number().min(2020).max(2100),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const dateSql = dateBetweenSql(input.bulan, input.tahun);

      const hadir = await db
        .select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(and(dateSql, eq(absensi.status, "hadir")));

      const terlambat = await db
        .select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(and(dateSql, eq(absensi.status, "terlambat")));

      const izin = await db
        .select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(and(dateSql, eq(absensi.status, "izin")));

      const sakit = await db
        .select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(and(dateSql, eq(absensi.status, "sakit")));

      const alpha = await db
        .select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(and(dateSql, eq(absensi.status, "alpha")));

      const totalPegawaiResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(dateSql);

      return {
        hadir: hadir[0]?.count || 0,
        terlambat: terlambat[0]?.count || 0,
        izin: izin[0]?.count || 0,
        sakit: sakit[0]?.count || 0,
        alpha: alpha[0]?.count || 0,
        totalPegawai: totalPegawaiResult[0]?.count || 0,
      };
    }),

  todayOverview: adminQuery.query(async () => {
    const db = getDb();
    const today = getTodayStr();

    const data = await db.query.absensi.findMany({
      where: sql`DATE(${absensi.tanggal}) = ${today}`,
      orderBy: (absensi, { desc }) => [desc(absensi.jamMasuk)],
      with: {
        pegawai: true,
      },
    });

    return data;
  }),
});
