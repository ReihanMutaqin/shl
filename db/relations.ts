import { relations } from "drizzle-orm";
import { pegawai, absensi, cuti, sessions } from "./schema.js";

export const pegawaiRelations = relations(pegawai, ({ many }) => ({
  absensi: many(absensi),
  cuti: many(cuti),
  sessions: many(sessions),
}));

export const absensiRelations = relations(absensi, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [absensi.pegawaiId],
    references: [pegawai.id],
  }),
}));

export const cutiRelations = relations(cuti, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [cuti.pegawaiId],
    references: [pegawai.id],
  }),
  approver: one(pegawai, {
    fields: [cuti.approvedBy],
    references: [pegawai.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [sessions.pegawaiId],
    references: [pegawai.id],
  }),
}));
