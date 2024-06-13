import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "unstake",
  password: "",
  port: 5432,
});

export const query = (text: string, params: string[]) =>
  pool.query(text, params);