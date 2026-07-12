import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  date,
  mysqlEnum,
  bigint,
} from "drizzle-orm/mysql-core";

export const pegawai = mysqlTable("pegawai", {
  id: serial("id").primaryKey(),
  idPegawai: varchar("id_pegawai", { length: 50 }).notNull().unique(),
  nama: varchar("nama", { length: 255 }).notNull(),
  jabatan: varchar("jabatan", { length: 100 }).notNull(),
  departemen: varchar("departemen", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["pegawai", "admin"]).notNull().default("pegawai"),
  isHidden: boolean("is_hidden").notNull().default(false),
  fotoProfile: varchar("foto_profile", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const absensi = mysqlTable("absensi", {
  id: serial("id").primaryKey(),
  pegawaiId: bigint("pegawai_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => pegawai.id),
  tanggal: date("tanggal").notNull(),
  shift: varchar("shift", { length: 50 }).notNull(),
  jamMasuk: timestamp("jam_masuk"),
  jamKeluar: timestamp("jam_keluar"),
  fotoMasuk: varchar("foto_masuk", { length: 500 }),
  fotoKeluar: varchar("foto_keluar", { length: 500 }),
  lokasiMasuk: varchar("lokasi_masuk", { length: 255 }),
  lokasiKeluar: varchar("lokasi_keluar", { length: 255 }),
  status: mysqlEnum("status", ["hadir", "terlambat", "izin", "sakit", "alpha"])
    .notNull()
    .default("hadir"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cuti = mysqlTable("cuti", {
  id: serial("id").primaryKey(),
  pegawaiId: bigint("pegawai_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => pegawai.id),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalSelesai: date("tanggal_selesai").notNull(),
  jenis: mysqlEnum("jenis", ["tahunan", "sakit", "melahirkan", "penting"])
    .notNull()
    .default("tahunan"),
  alasan: text("alasan").notNull(),
  status: mysqlEnum("status", ["pending", "disetujui", "ditolak"])
    .notNull()
    .default("pending"),
  approvedBy: bigint("approved_by", { mode: "number", unsigned: true }).references(() => pegawai.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  pegawaiId: bigint("pegawai_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => pegawai.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
