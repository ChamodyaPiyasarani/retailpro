# REST API tests (REST Client)

These files call the Supabase REST API directly. They show that every record of the
system is stored in the database and can be read, created, updated and deleted through the API.

| File | Tables | Use cases |
|---|---|---|
| `00-sign-in.http` | Supabase Auth, `user`, `role_permission` | Log in, Reset password, Log out |
| `01-admin.http` | `role`, `permission`, `role_permission`, `user`, `technician`, `technician_specialisation`, `discount` | Manage roles and permissions, Manage user accounts, Manage discounts |
| `02-stock.http` | `category`, `product`, `stock_alert`, `stock_movement`, `spare_part_request` | Manage categories / products, View stock levels, Receive / Adjust stock, Issue spare parts |
| `03-sales.http` | `customer`, `sales_order`, `sales_order_item`, `invoice`, `warranty`, `return_request`, `refund` | Manage customers, Create sales order, Purchase history, Check warranty, Returns, Refunds, Outstanding invoices |
| `04-purchasing.http` | `supplier`, `product_supplier`, `quotation`, `purchase_order`, `purchase_order_item` | Manage suppliers, Request quotation, Create / Approve / Track purchase orders |
| `05-service.http` | `service_job`, `repair_note`, `technician`, `invoice` | Register service request, Assign technician, View assigned jobs, Update job status, View service history |
| `06-finance-reports.http` | `payment`, `purchase_order`, `report`, `sales_order` | Payments, Reports, Dashboard |

## Step by step

1. In Antigravity open the **Extensions** panel, search **REST Client** (by Huachao Mao) and install it.
2. Copy `api-tests/.env.example` to `api-tests/.env`.
3. Open `api-tests/.env` and fill in:
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` – the same values as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the app's `.env`;
   - `TEST_EMAIL` and `TEST_PASSWORD` – a staff account, e.g. the admin account.
   The `.env` file is ignored by Git, so it is never uploaded.
4. Open any `.http` file and click **Send Request** above **"0) Sign in first"**. The answer shows an `access_token`.
5. Now click **Send Request** above any other request. The result opens on the right.
6. The Create → Read → Update → Delete requests use test records (`API Test Role`, `API Test Product`, `API Test Customer` …).
   Run them in order, so the test record is removed at the end.
   Two requests need the id made by the step before them (`role_id` in `01-admin.http` step 7, `category_id` in `02-stock.http` step 8) –
   copy the id from the answer of that step.

## Notes

- Without signing in, the tables return an empty list – Row Level Security protects the data.
- `select=...,customer(name)` joins a related table through its foreign key.
- Filters: `eq.` equal, `neq.` not equal, `lte.` less or equal, `in.(a,b)` one of, `is.null` empty, `not.is.null` not empty.
