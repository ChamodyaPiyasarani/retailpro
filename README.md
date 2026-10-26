# RetailPro — Integrated Retail & Service Management System

RetailPro is an enterprise-grade internal web application designed for a modern retail business selling computer and IT hardware parts and providing on-site PC/network installation, maintenance, repair services, and warranty lifecycle management.

---

## 🚀 Quick Start Guide (How to Run Locally)

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### Step 1: Open Terminal in Project Directory
Ensure your terminal or PowerShell prompt is in the `WebApp` root folder:

### Step 2: Install Dependencies (if not already installed)
```bash
npm install
```

### Step 3: Start Vite Development Server
```bash
npm run dev
```

### Step 4: Open in Your Browser
Once the dev server starts, open your browser and navigate to:
```
http://localhost:5173
```
*(If port 5173 is in use, Vite will indicate the alternate port in your terminal output).*

---

## 🔑 Demo User Accounts

You can sign in with any of the pre-configured role-based staff accounts directly from the login screen (using the one-click **Quick Demo Login** buttons or typing credentials):

| Role | Name | Email | Password | Primary Accessible Modules |
| :--- | :--- | :--- | :--- | :--- |
| **Admin / Manager** | Kamal Perera | `admin@retailpro.lk` | `Admin@123` | Full access across all 12 modules, Settings, User Management |
| **Sales Staff** | Dilani Silva | `sales@retailpro.lk` | `Sales@123` | POS, Sales Orders, Invoices, Customers, Returns |
| **Storekeeper** | Ruwan Fernando | `store@retailpro.lk` | `Store@123` | Stock, Inventory Adjustments, Movements, Service Parts |
| **Purchasing Officer** | Anusha Perera | `purchase@retailpro.lk` | `Purch@123` | Suppliers, Purchase Orders, Goods Receipt |
| **Finance / Accounts** | Chaminda Jay | `finance@retailpro.lk` | `Fin@123` | Customer Payments, Outstanding Receivables, Supplier Payables |
| **Technician** | Nuwan Bandara | `tech@retailpro.lk` | `Tech@123` | Service Jobs, Visit Logs, Parts Issuance, Service History |

---

## 📦 System Modules & Key Features

1. **Point of Sale (POS)**
   - Category filtering, real-time SKU search, barcode simulation
   - Customer selection (walk-in or registered accounts)
   - Dynamic cart calculations (15% VAT, discounts, cash/card/transfer tender)
   - Stock deduction and instant printable receipt modal

2. **Sales Orders & Invoices**
   - Full order registry with payment & fulfillment status filters
   - Detailed invoice inspection with itemized breakdowns and print views

3. **Customer Management**
   - Customer registry, balances, purchase histories, and credit tracking

4. **Inventory & Stock Management**
   - Live stock counts, low-stock threshold badges, out-of-stock highlights
   - Manual stock adjustments (in, out, reconciliation) with audit movement log

5. **Purchasing & Goods Receipt**
   - Purchase order lifecycle (`draft` → `sent` → `received`)
   - Discrepancy checks during goods receiving and automatic stock increments

6. **Service & Repair Management**
   - Ticket logging with priority levels (`low`, `medium`, `high`, `urgent`)
   - Technician assignment, job status updates (`assigned`, `in_progress`, `completed`)
   - Spare parts issuance directly from stock with cost tracking
   - Technician visit logs and customer sign-off

7. **Warranty, Returns & Complaints**
   - Strict warranty validation for refund and exchange workflows
   - Manager approval stage before refund payments
   - Customer complaint logging with escalation tracking

8. **Finance & Payables**
   - Customer payment entry against specific sales orders
   - Outstanding accounts receivable monitoring
   - Supplier payables tracking and settlement

9. **Consolidated Reports & Analytics**
   - Interactive charts (monthly revenue trends, service category breakdown, inventory valuation)
   - One-click CSV export for reports

10. **Users, Roles & System Settings**
    - Account locking/unlocking, RBAC permission matrices, audit trail logs
    - Store profile, tax rates, prefixes, and warranty policies

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite 8
- **Routing**: React Router 7 (`HashRouter` for zero-configuration refreshes)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Styling**: Tailored Dark Modern Glassmorphism CSS Design System
- **Dates**: date-fns


---

## Hosting: GitHub Pages + Supabase

The app is a static React (Vite) site, so it is hosted on **GitHub Pages**, and its data and log-in live in **Supabase** (PostgreSQL + Supabase Auth).

### 1. Supabase (database and log-in)
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql` and click **Run**. This creates the 33 tables from the File Design, the foreign keys, Row Level Security and the trigger that creates a `user` row for each new staff account.
3. Create staff accounts in **Authentication > Users** (Supabase Auth stores the passwords and sends password-reset e-mails).
4. Copy `.env.example` to `.env` and paste your **Project URL** and **anon public key** (Project Settings > API).

### 2. GitHub Pages (hosting)
1. Create a GitHub repository named `retailpro` (it must match `base: '/retailpro/'` in `vite.config.js`) and push this folder to it.
2. In `package.json`, replace `YOUR-GITHUB-USERNAME` in `homepage` with your GitHub username.
3. Run `npm run deploy`. This builds the site with your `.env` values and publishes `dist` to the `gh-pages` branch.
4. In the repository: **Settings > Pages > Source: Deploy from a branch > gh-pages**.

The site uses `HashRouter`, so page refreshes work on GitHub Pages without extra settings.

Optional: `deploy/github-pages-workflow.yml` deploys automatically on every push. Move it to `.github/workflows/deploy.yml` and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets.
