# Supabase database – set-up steps

All company data is stored in Supabase. The app has **no hard-coded data**: every
screen reads the tables and every change is saved straight back to the database.
The 28 tables are exactly the tables of the **Table Design** and **Schema Mapping**
(`Diagrams/new smaller version/5 - Table Design` and `6 - Schema Mapping`).

## Step by step

1. Open your project at https://supabase.com → **Authentication → Users**.
   Check that these 6 staff accounts exist (password `123456`). Add any that are missing with **Add user → Create new user**:
   `admin@gmail.com`, `cashier@gmail.com`, `storekeeper@gmail.com`, `purchase@gmail.com`, `finance@gmail.com`, `tech@gmail.com`
2. Open **SQL Editor → New query**, paste the whole of `01_new_schema.sql` and click **Run**.
   - It **deletes the old tables** (and the old trigger `on_auth_user_created`) and creates the 28 new tables,
     their primary keys, foreign keys, checks and Row Level Security.
3. Open a **new query**, paste the whole of `02_new_company_data.sql` and click **Run**.
   - It loads the Rajida Holdings data: 6 roles, 35 permissions (one for each use case), 6 users,
     12 products, 6 customers, 4 suppliers, sales orders, invoices, payments, purchase orders, service jobs …
   - Dates are written as `current_date - n`, so the data always looks recent.
   - The last query lists any staff e-mail that is missing in Supabase Auth – it should show **no rows**.
4. Log in to the app with `admin@gmail.com` / `123456`.

You can run steps 2 and 3 again at any time to start again from the original data.

## Notes

- **Passwords** are kept (encrypted) by **Supabase Auth**, not in the `user` table. The `password` column only
  holds the note *(kept encrypted by Supabase Auth)*. The app links an Auth account to its `user` row by **e-mail**.
- **Roles and permissions:** `permission` has one row per use case (all use cases except Log in / Log out).
  `role_permission` says which role may use which function. The Admin changes this in **Roles & Permissions**,
  and the menu of each user is built from these rows.
- New staff accounts made in **User Accounts** are added to Supabase Auth automatically (sign-up), so the Admin
  is not logged out. If e-mail confirmation is on (Authentication → Providers → Email → *Confirm email*), the new
  staff member must click the link in the e-mail before the first log in.
- The old SQL files from the earlier version are kept in `old/` only for reference. **Do not run them.**

## Tables

| Module | Tables |
|---|---|
| Administration | `user`, `role`, `permission`, `role_permission`, `technician`, `technician_specialisation`, `discount` |
| Stock | `category`, `product`, `stock_movement`, `stock_alert`, `spare_part_request` |
| Sales | `customer`, `sales_order`, `sales_order_item`, `invoice`, `warranty`, `return_request`, `refund` |
| Purchasing | `supplier`, `product_supplier`, `quotation`, `purchase_order`, `purchase_order_item` |
| Service | `service_job`, `repair_note` |
| Finance / Reports | `payment`, `report` |
