import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

import mysql from "mysql2/promise";

let poolConnection: mysql.Pool;

export function getDb() {
  if (!instance) {
    poolConnection = mysql.createPool(env.databaseUrl);
    instance = drizzle(poolConnection, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}
