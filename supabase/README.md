# Supabase database – set-up steps

All company data (products, customers, sales, purchases, service jobs, payments …)
is stored in Supabase. The app has **no hard-coded data**: after a staff member
signs in, it reads every table, and every change made in the app is saved back
to the database straight away (see `src/lib/db/sync.js`).

Run the SQL files **in this order** in Supabase → **SQL Editor** → **New query** → paste → **Run**:

| Step | File | What it does |
|---|---|---|
| 1 | `schema.sql` | Creates the 33 tables of the File Design, foreign keys and Row Level Security (already done earlier). |
| 2 | `02_app_columns.sql` | Adds the extra columns the screens use, the `audit_log` table, and lets the app choose record numbers. Safe to run again. |
| 3 | `03_match_file_design.sql` | Makes the database match the File Design: File Design key and column names, `granted_date` / `access_type` on Role_permission, data types (rating NUMERIC(2,1), payment_terms INTEGER, VARCHAR(500)), and the new `technician_specialisation` table (multivalued attribute). Your data is kept. Safe to run again. |
| 4 | `04_company_data.sql` | Loads the Rajida Holdings company data: 12 products, 5 customers, 4 suppliers, 6 months of sales (63 invoices), 26 purchase orders, 38 service jobs, payments, returns, complaints, settings, roles and permissions. **It replaces the business records**, so run it only when you want to start again from this data. |

Before step 4 the 6 staff accounts must exist in **Authentication → Users**
(admin, cashier, storekeeper, purchase, finance, tech @gmail.com).
The last query of step 4 lists any account that is missing (it should show no rows).

## How app records map to tables

| App number | Table and id |
|---|---|
| P001 | `product.product_id = 1` |
| C001 | `customer.customer_id = 1` |
| SUP001 | `supplier.supplier_id = 1` |
| SO-062 / INV-2026-062 | `sales_order.sales_order_id = 62`, lines in `sales_order_item`, `invoice.invoice_id = 62` |
| PO-025 | `purchase_order.po_id = 25`, lines in `purchase_order_item`, `payable.payable_id = 25` |
| JOB-038 | `service_job.service_job_id = 38`, visits in `service_visit_log` |
| RET-001 | `exchange_request.exchange_request_id = 1` (+ `refund`, `returned_item`) |
| PAY-001 / SPAY-001 | `payment.payment_id = 1` / `50001` (+ `transaction`) |
| CR-001 | `credit_account.account_id = 1001` (customer credit accounts use the customer number) |
| Staff user | `"user".user_id` = the Supabase Auth id, role in `role`, technicians in `technician`, their skills in `technician_specialisation` |

Values that only the screens need (icons, notes, flags) are kept in each row's `details` JSON column.
