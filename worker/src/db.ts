import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'arena',
    password: process.env.POSTGRES_PASSWORD || 'arena_secret_2026',
    database: process.env.POSTGRES_DB || 'arena',
});

client.connect().catch((err) => console.error('Database connection error', err.stack));

export default client;
