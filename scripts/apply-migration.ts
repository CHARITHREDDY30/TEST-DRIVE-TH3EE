import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const migrationFile = process.argv[2] || 'migrations/20261020150000_coupon_security_and_loyalty_club.sql';
const filePath = path.resolve(process.cwd(), migrationFile);

if (!fs.existsSync(filePath)) {
  console.error(`Migration file not found: ${filePath}`);
  process.exit(1);
}

const sql = fs.readFileSync(filePath, 'utf8');

console.log(`Applying migration: ${migrationFile}...`);

// Strip comments and format SQL
const strippedSql = sql.replace(/--.*$/gm, '');
const cleanSql = strippedSql.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const res = spawnSync('cmd.exe', ['/c', 'insforge', 'db', 'query', cleanSql], {
  encoding: 'utf8',
  stdio: 'inherit'
});

if (res.status !== 0) {
  console.error('Migration failed!');
  process.exit(res.status || 1);
}

console.log('✓ Migration applied successfully!');
