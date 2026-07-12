import { getDb } from "./server/queries/connection";
import { sql } from "drizzle-orm";

async function drop() {
  const db = await getDb();
  await db.execute(sql`DROP TABLE IF EXISTS sessions;`);
  await db.execute(sql`DROP TABLE IF EXISTS cuti;`);
  await db.execute(sql`DROP TABLE IF EXISTS absensi;`);
  await db.execute(sql`DROP TABLE IF EXISTS pegawai;`);
  console.log("Tables dropped.");
  process.exit(0);
}
drop();
