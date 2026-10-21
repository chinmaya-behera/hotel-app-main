import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
const sql=neon(process.env.DATABASE_URL);
const source=await readFile(new URL('../migrations/001_preview.sql',import.meta.url),'utf8');
const statements=source.split(';').map(s=>s.trim()).filter(Boolean);
await sql.transaction(statements.map(statement=>sql.query(statement)));
console.log('Public-preview schema migration completed.');
