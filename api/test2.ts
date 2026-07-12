import mysql from "mysql2/promise";
export default function handler(req: any, res: any) {
  res.status(200).json({ status: "mysql2 loaded" });
}
