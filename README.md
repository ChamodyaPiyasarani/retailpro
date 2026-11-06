# Rajida Holdings – Retail Management System

A web system for Rajida Holdings, a shop that sells computer parts and repairs computers.
It covers sales, stock, purchasing, service jobs, payments and reports, with a log-in for each staff role.

The system is built **from the diagrams** in `Diagrams/new smaller version`:

| Diagram | In the code |
|---|---|
| Proposed use case diagram (37 use cases) | the pages in `src/pages` and the menu in `src/config/menu.js` |
| Class diagram (27 classes) | one file per class in `src/classes` – the methods have the same names as in the diagram |
| Sequence diagrams | each page ("Form") calls the class methods in the same order as its sequence diagram |
| ER diagram, Table Design, Schema Mapping (28 tables) | `supabase/01_new_schema.sql` |

---

## Run it on your computer

1. Install **Node.js** 20 or newer.
2. Open a terminal in the `retailpro` folder and install the packages:
   ```bash
   npm install
   ```
3. Make the database once – follow `supabase/README.md` (run `01_new_schema.sql`, then `02_new_company_data.sql`).
4. Copy `.env.example` to `.env` and paste your Supabase **Project URL** and **anon public key**
   (Supabase → Project Settings → API). Never upload `.env` – it is ignored by Git.
5. Start the app:
   ```bash
   npm run dev
   ```
6. Open the address shown in the terminal (for example `http://localhost:5173/retailpro/`).

## Staff accounts (one per role)

The login page has one button for each account. Password for all: `123456`.

| Role | Name | E-mail | What the role can do |
|---|---|---|---|
| Admin / Manager | Amara Silva | `admin@gmail.com` | user accounts, roles & permissions, products, categories, discounts, approvals, assign technicians, dashboard, business reports |
| Sales Staff / Cashier | Kamal Perera | `cashier@gmail.com` | sales orders and sales history, customer payments, invoice history, customers, warranty check, service requests, return requests |
| Storekeeper | Nimal Fernando | `storekeeper@gmail.com` | stock levels, receive stock, adjust stock, issue spare parts, stock reports |
| Purchasing Manager | Dilshan Ranjith | `purchase@gmail.com` | suppliers, quotations, purchase orders, tracking, reorder low stock |
| Finance Manager | Sanduni Perera | `finance@gmail.com` | outstanding invoices and invoice history, supplier payments, refunds, all payments, financial reports |
| Technician | Ruwan Jayasena | `tech@gmail.com` | assigned jobs, update job status (repair notes, spare parts), service history |

### Reports and history

- **Reports** (11): Business – Sales, Product sales, Customer, Service · Stock – Stock level, Stock movement, Low stock ·
  Financial – Income & payments, Outstanding invoices, Supplier purchases, Returns & refunds.
  Each report has totals, a chart, a table, Print and Export PDF. Every report made is saved in the `report` table and
  listed in **Report history**, where it can be opened again.
- **History screens:** Sales history (Sales Orders page), Invoice history and invoice details with payments, warranty and returns
  (Invoices page), earlier payments of an invoice and supplier payment history (Payments page), customer purchase history,
  supplier order history, stock history of each product, issued spare parts, service job details.

What each role can do is **not fixed in the code**: it comes from the `role_permission` table.
The Admin can change it, or make a new role, in **Roles & Permissions**. The menu shows only the pages the role may use.

## Folders

| Folder | What is inside |
|---|---|
| `src/classes` | the 27 classes of the class diagram (`db.js` has the small helpers that talk to Supabase) |
| `src/pages` | the screens (the "Forms" of the sequence diagrams) |
| `src/context` | the logged-in user and permissions (`AuthContext`), messages (`ToastContext`), dark / light theme |
| `src/components` | the page layout with the menu, and small parts used by every page (`ui.jsx`) |
| `src/config` | the menu and the demo account buttons |
| `supabase` | the SQL files for the database (see `supabase/README.md`) |
| `api-tests` | REST Client files that test the database through the Supabase REST API (see `api-tests/README.md`) |
| `tests` | unit tests (`npm test`, see `tests/README.md`) |

## Checks

```bash
npm test        # unit tests
npm run lint    # code check
npm run build   # production build into dist/
```

## Tech stack

React 19 + Vite, React Router (`HashRouter`), Supabase (PostgreSQL + Supabase Auth), Recharts, jsPDF, Lucide icons, Vitest.

## Hosting: GitHub Pages + Supabase

The app is a static site, so it is hosted on **GitHub Pages**; its data and log-in are in **Supabase**.

1. The repository name must match `base: '/retailpro/'` in `vite.config.js`.
2. In the repository: **Settings → Secrets and variables → Actions** – add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Settings → Pages → Source: GitHub Actions**.
4. Every push to `main` builds and publishes the site (`.github/workflows/deploy.yml`).

The anon key is safe in a public site because every table is protected by Row Level Security:
only signed-in staff can read or change data.
