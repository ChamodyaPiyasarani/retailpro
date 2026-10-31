# REST API tests (REST Client)

These files call the Supabase REST API directly, so you can show that every
record of the app is stored in the database and can be read, created, updated
and deleted through the API.

| File | Tables |
|---|---|
| `00-sign-in.http` | sign in, my profile, protected data without a token, sign out |
| `01-inventory.http` | category, product (full Create / Read / Update / Delete), batch, stock_movement, stock_alert, spare_part_request |
| `02-customers-sales.http` | customer (CRUD), credit_account, sales_order + lines, invoice, discount, warranty_record |
| `03-purchasing.http` | supplier (CRUD), quotation, purchase_order + lines, payable |
| `04-service.http` | technician, service_job (CRUD) + visit log, exchange_request, refund, returned_item, complaint |
| `05-finance.http` | payment, transaction, payable, service invoices |
| `06-admin.http` | user, role, role_permission, system_setting, report, audit_log |

## Step by step

1. In Antigravity open the **Extensions** panel, search **REST Client** (by Huachao Mao) and install it.
2. Copy `api-tests/.env.example` to `api-tests/.env`.
3. Open `api-tests/.env` and fill in:
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` – the same values as in the app's `.env`
     (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`);
   - `TEST_EMAIL` and `TEST_PASSWORD` – a staff account, e.g. the admin account.
   The `.env` file is ignored by Git, so it is never uploaded.
4. Open any `.http` file. Click **Send Request** above **"0) Sign in first"** – the answer shows an `access_token`.
5. Now click **Send Request** above any other request. The result opens on the right.
6. The Create → Read → Update → Delete requests use test records (`TEST-API-001`, `API Test Customer` …).
   Run them in order so the test record is removed at the end.

Notes
- Without signing in, the tables return an empty list – Row Level Security protects the data.
- If you add records from here while the web app is open, sign out and in again in the app
  so it reads the new records.
- `select=...,customer(name)` joins a related table through its foreign key.
  Filters: `eq.` equal, `neq.` not equal, `lte.` less or equal, `in.(a,b)` one of, `like.text*` starts with.
