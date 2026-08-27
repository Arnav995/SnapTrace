import pg from "pg";

import {env} from "./env.js"

const { Pool } = pg;

export const pool = new Pool({
     connectionString: env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);