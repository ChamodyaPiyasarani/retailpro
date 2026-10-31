// Shared test helpers.
// tests/fixtures/company_data.json is a copy of every table after running
// schema.sql -> 02_app_columns.sql -> 03_match_file_design.sql -> 04_company_data.sql
// (the same rows the app reads from Supabase).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const loadRows = () => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'company_data.json'), 'utf8'));

// A value as the database would compare it (numbers stored as text, timestamps vs dates)
export const norm = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v)) return v.slice(0, 10);
  if (typeof v === 'string' && v !== '' && !isNaN(Number(v))) return Number(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
};

// yyyy-mm-dd, n days from today
export const day = (n = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
