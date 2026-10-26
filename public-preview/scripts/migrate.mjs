import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
const sql=neon(process.env.DATABASE_URL);
const source=(await Promise.all(['001_preview.sql','002_demo_accounts.sql','003_finance_review.sql','004_experience_identity.sql'].map(name=>readFile(new URL('../migrations/'+name,import.meta.url),'utf8')))).join('\n');
const statements=source.split(';').map(s=>s.trim()).filter(Boolean);
await sql.transaction(statements.map(statement=>sql.query(statement)));
console.log('Public-preview schema migration completed.');
