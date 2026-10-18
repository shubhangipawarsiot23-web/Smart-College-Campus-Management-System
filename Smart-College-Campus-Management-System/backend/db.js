import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'smart_campus_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

pool.on('error', (err) => console.error('Unexpected PostgreSQL pool error:', err));
