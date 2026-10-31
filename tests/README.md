# Unit tests

Run all tests:

```
npm test
```

(the first time, run `npm install` so Vitest is installed)

| File | What it checks |
|---|---|
| `schemaMap.test.js` | App records ↔ database rows: id codes (P001 ↔ 1), roles, File Design column names, technician skills in `technician_specialisation`, technician numbers never reused, and a **round trip of every table** (company data → app → database rows gives exactly the same rows) |
| `store.test.js` | Store helpers: loading/clearing, lookups, new record numbers, low stock, overdue POs, outstanding invoices, warranty check, promotion codes, phone/e-mail validation, available technicians, transactions, newest-first and low-stock-first ordering |
| `reports.test.js` | The six management reports, date range check, totals add up, CSV export |
| `sync.test.js` | Loading from and saving to Supabase (with a fake in-memory Supabase): only changed rows are saved, new rows inserted parents first, removed rows deleted children first, staff are deactivated (not deleted), technician rows are never deleted, skill rows use the two-column key, errors show "Not saved", sign-out |
| `staffAccounts.test.js` | Creating staff accounts (password length, duplicate e-mail, errors, role saved) and the demo accounts on the login page |

`fixtures/company_data.json` is a copy of every table after running the SQL files
in `supabase/` (schema → 02 → 03 → 04), so the tests use the same data as the real database.
The tests never connect to the real Supabase project.
