import { env } from '$env/dynamic/private';
const { DATABASE_URL } = env;

import pkg from "pg";
const { Pool } = pkg;

const url = new URL(DATABASE_URL);
const host = url.hostname;
const database = url.pathname.slice(1);
const password = url.password || "";
const port = parseInt(url.port || "5432", 10);
const user = url.username;

const pool = new Pool({
  user,
  host,
  database,
  password,
  port,
});

export const postgresQuery = (text: string, params: string[]) =>
  pool.query(text, params);
