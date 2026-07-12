import { getDb } from "../api/queries/connection";
import { pegawai } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  const db = getDb();

  // Check if admin already exists
  const existingAdmin = await db.query.pegawai.findFirst({
    where: (p, { eq }) => eq(p.role, "admin"),
  });

  if (existingAdmin) {
    console.log("Admin already exists, skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await db.insert(pegawai).values({
    idPegawai: "ADMIN001",
    nama: "Administrator",
    jabatan: "System Admin",
    departemen: "IT",
    password: hashedPassword,
    role: "admin",
    isHidden: true,
  });

  console.log("Seeded admin user: ADMIN001 / admin123");
}

seed().catch(console.error);
