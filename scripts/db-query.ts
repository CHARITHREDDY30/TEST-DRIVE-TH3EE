import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const sql = process.argv[2];
if (!sql) {
  console.error('Usage: npx tsx scripts/db-query.ts "<sql>"');
  process.exit(1);
}

const res = spawnSync('cmd.exe', ['/c', 'insforge', 'db', 'query', sql], {
  encoding: 'utf8',
  stdio: 'inherit'
});

process.exit(res.status || 0);
