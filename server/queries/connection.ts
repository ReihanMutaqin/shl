import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";

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
    }) as any;
  }
  return instance;
}
