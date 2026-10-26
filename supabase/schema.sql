-- Supabase (PostgreSQL) schema generated from the File Design (33 tables).
-- Run this in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Log-in, passwords and password reset are handled by Supabase Auth (auth.users).
-- "user".user_id is the same UUID as auth.users.id.

create table if not exists "user" (
  user_id uuid primary key,
  username varchar(50),
  full_name varchar(100),
  email varchar(100),
  phone varchar(20),
  user_type varchar(30),
  is_active boolean,
  is_locked boolean,
  created_at timestamp,
  access_level varchar(30),
  department varchar(50),
  last_login_at timestamp,
  role_id bigint
);

create table if not exists role (
  role_id bigint generated always as identity primary key,
  role_name varchar(50),
  description varchar(150),
  is_active boolean
);

create table if not exists permission (
  permission_id bigint generated always as identity primary key,
  permission_name varchar(100),
  module varchar(50),
  action varchar(50)
);

create table if not exists role_permission (
  role_id bigint not null,
  permission_id bigint not null,
  primary key (role_id, permission_id)
);

create table if not exists system_setting (
  setting_id bigint generated always as identity primary key,
  setting_key varchar(100),
  setting_value text,
  category varchar(50),
  warranty_months integer,
  warranty_terms text,
  updated_at timestamp,
  updated_by uuid
);

create table if not exists report (
  report_id bigint generated always as identity primary key,
  report_type varchar(50),
  generated_date timestamp,
  schedule_frequency varchar(30),
  format varchar(20),
  module varchar(50),
  recipients varchar(255),
  generated_by uuid
);

create table if not exists category (
  category_id bigint generated always as identity primary key,
  category_name varchar(100),
  description varchar(255),
  parent_category_id bigint
);

create table if not exists product (
  product_id bigint generated always as identity primary key,
  sku varchar(50),
  name varchar(100),
  description varchar(255),
  unit_price numeric(12,2),
  cost_price numeric(12,2),
  stock_qty integer,
  reorder_level integer,
  unit_of_measure varchar(20),
  is_spare_part boolean,
  warranty_period_months integer,
  condition varchar(30),
  is_active boolean,
  category_id bigint
);

create table if not exists batch (
  batch_id bigint generated always as identity primary key,
  batch_serial_number varchar(100),
  manufacture_date date,
  supplier_warranty_expiry date,
  quantity integer,
  supplier_ref varchar(50),
  status varchar(20),
  product_id bigint
);

create table if not exists stock_movement (
  movement_id bigint generated always as identity primary key,
  movement_type varchar(30),
  quantity integer,
  reason varchar(255),
  movement_date timestamp,
  reference_doc_id bigint,
  product_id bigint,
  user_id uuid,
  service_job_id bigint,
  batch_id bigint
);

create table if not exists stock_alert (
  alert_id bigint generated always as identity primary key,
  alert_type varchar(30),
  threshold_qty integer,
  current_qty integer,
  created_at timestamp,
  is_resolved boolean,
  product_id bigint
);

create table if not exists returned_item (
  return_id bigint generated always as identity primary key,
  return_date date,
  reason varchar(255),
  condition varchar(50),
  is_serviceable boolean,
  is_damaged boolean,
  product_id bigint,
  received_by uuid,
  exchange_request_id bigint
);

create table if not exists customer (
  customer_id bigint generated always as identity primary key,
  name varchar(100),
  phone varchar(20),
  email varchar(100),
  address varchar(255),
  customer_type varchar(30),
  registered_date date
);

create table if not exists credit_account (
  account_id bigint generated always as identity primary key,
  credit_limit numeric(12,2),
  current_balance numeric(12,2),
  status varchar(20),
  last_review_date date,
  requested_limit numeric(12,2),
  customer_id bigint,
  approved_by uuid
);

create table if not exists sales_order (
  order_id bigint generated always as identity primary key,
  order_date timestamp,
  subtotal numeric(12,2),
  discount_amount numeric(12,2),
  tax_amount numeric(12,2),
  total_amount numeric(12,2),
  payment_type varchar(30),
  status varchar(30),
  delivery_required boolean,
  installation_required boolean,
  customer_id bigint,
  created_by uuid,
  discount_id bigint
);

create table if not exists sales_order_item (
  item_id bigint generated always as identity primary key,
  quantity integer,
  unit_price numeric(12,2),
  line_discount numeric(12,2),
  warranty_months integer,
  sales_order_id bigint,
  product_id bigint
);

create table if not exists invoice (
  invoice_id bigint generated always as identity primary key,
  invoice_date date,
  amount_due numeric(12,2),
  due_date date,
  status varchar(20),
  notes varchar(255),
  sales_order_id bigint,
  service_job_id bigint
);

create table if not exists discount (
  discount_id bigint generated always as identity primary key,
  discount_name varchar(100),
  discount_type varchar(20),
  discount_value numeric(12,2),
  start_date date,
  end_date date,
  is_active boolean,
  min_order_amount numeric(12,2),
  discount_code varchar(20)
);

create table if not exists warranty_record (
  warranty_id bigint generated always as identity primary key,
  sale_date date,
  expiry_date date,
  warranty_terms text,
  status varchar(20),
  product_id bigint,
  sales_order_id bigint
);

create table if not exists exchange_request (
  request_id bigint generated always as identity primary key,
  request_date date,
  request_type varchar(30),
  reason varchar(255),
  status varchar(30),
  approved_date date,
  sales_order_id bigint,
  customer_id bigint,
  product_id bigint,
  approved_by uuid,
  service_job_id bigint
);

create table if not exists refund (
  refund_id bigint generated always as identity primary key,
  refund_date date,
  refund_amount numeric(12,2),
  refund_method varchar(30),
  status varchar(20),
  reason varchar(255),
  return_received boolean,
  payment_id bigint,
  authorised_by uuid,
  exchange_request_id bigint
);

create table if not exists complaint (
  complaint_id bigint generated always as identity primary key,
  complaint_date date,
  description text,
  status varchar(30),
  priority varchar(20),
  resolved_date date,
  resolution text,
  customer_id bigint,
  logged_by uuid,
  service_job_id bigint
);

create table if not exists service_job (
  job_id bigint generated always as identity primary key,
  job_type varchar(50),
  scheduled_date timestamp,
  completed_date timestamp,
  status varchar(30),
  priority varchar(20),
  fault_description text,
  resolution_notes text,
  visit_count integer,
  billing_status varchar(20),
  sales_order_id bigint,
  technician_id bigint
);

create table if not exists service_visit_log (
  visit_log_id bigint generated always as identity primary key,
  visit_date timestamp,
  visit_notes text,
  visit_type varchar(30),
  duration_minutes integer,
  service_job_id bigint,
  logged_by uuid
);

create table if not exists spare_part_request (
  request_id bigint generated always as identity primary key,
  requested_qty integer,
  issued_qty integer,
  request_date date,
  status varchar(30),
  service_job_id bigint,
  product_id bigint,
  issued_by uuid
);

create table if not exists supplier (
  supplier_id bigint generated always as identity primary key,
  name varchar(100),
  contact_person varchar(100),
  phone varchar(20),
  email varchar(100),
  address varchar(255),
  rating integer,
  payment_terms varchar(100),
  lead_time_days integer,
  status varchar(20)
);

create table if not exists quotation (
  quotation_id bigint generated always as identity primary key,
  request_date date,
  quoted_price numeric(12,2),
  valid_until date,
  status varchar(20),
  notes varchar(255),
  supplier_id bigint
);

create table if not exists purchase_order (
  po_id bigint generated always as identity primary key,
  order_date date,
  expected_delivery_date date,
  received_date date,
  subtotal numeric(12,2),
  tax_amount numeric(12,2),
  total_amount numeric(12,2),
  status varchar(30),
  is_urgent boolean,
  supplier_id bigint,
  created_by uuid,
  quotation_id bigint
);

create table if not exists purchase_order_item (
  item_id bigint generated always as identity primary key,
  quantity integer,
  unit_cost numeric(12,2),
  received_qty integer,
  po_id bigint,
  product_id bigint
);

create table if not exists payable (
  payable_id bigint generated always as identity primary key,
  amount_due numeric(12,2),
  due_date date,
  status varchar(20),
  po_id bigint,
  supplier_id bigint
);

create table if not exists payment (
  payment_id bigint generated always as identity primary key,
  payment_date date,
  amount numeric(12,2),
  payment_method varchar(30),
  payment_type varchar(30),
  reference_number varchar(50),
  is_refund boolean,
  invoice_id bigint,
  payable_id bigint,
  recorded_by uuid
);

create table if not exists transaction (
  transaction_id bigint generated always as identity primary key,
  transaction_type varchar(30),
  amount numeric(12,2),
  transaction_date timestamp,
  related_reference varchar(50),
  category varchar(50),
  is_reconciled boolean,
  payment_id bigint,
  invoice_id bigint
);

create table if not exists technician (
  technician_id bigint generated always as identity primary key,
  specialisation varchar(100),
  certification_level varchar(100),
  assigned_zone varchar(100),
  is_available boolean,
  user_id uuid
);

-- Link each app user to its Supabase Auth account
alter table "user" add foreign key (user_id) references auth.users(id) on delete cascade;

-- Foreign keys
alter table "user" add foreign key (role_id) references role(role_id);
alter table role_permission add foreign key (role_id) references role(role_id);
alter table role_permission add foreign key (permission_id) references permission(permission_id);
alter table system_setting add foreign key (updated_by) references "user"(user_id);
alter table report add foreign key (generated_by) references "user"(user_id);
alter table category add foreign key (parent_category_id) references category(category_id);
alter table product add foreign key (category_id) references category(category_id);
alter table batch add foreign key (product_id) references product(product_id);
alter table stock_movement add foreign key (product_id) references product(product_id);
alter table stock_movement add foreign key (user_id) references "user"(user_id);
alter table stock_movement add foreign key (service_job_id) references service_job(job_id);
alter table stock_movement add foreign key (batch_id) references batch(batch_id);
alter table stock_alert add foreign key (product_id) references product(product_id);
alter table returned_item add foreign key (product_id) references product(product_id);
alter table returned_item add foreign key (received_by) references "user"(user_id);
alter table returned_item add foreign key (exchange_request_id) references exchange_request(request_id);
alter table credit_account add foreign key (customer_id) references customer(customer_id);
alter table credit_account add foreign key (approved_by) references "user"(user_id);
alter table sales_order add foreign key (customer_id) references customer(customer_id);
alter table sales_order add foreign key (created_by) references "user"(user_id);
alter table sales_order add foreign key (discount_id) references discount(discount_id);
alter table sales_order_item add foreign key (sales_order_id) references sales_order(order_id);
alter table sales_order_item add foreign key (product_id) references product(product_id);
alter table invoice add foreign key (sales_order_id) references sales_order(order_id);
alter table invoice add foreign key (service_job_id) references service_job(job_id);
alter table warranty_record add foreign key (product_id) references product(product_id);
alter table warranty_record add foreign key (sales_order_id) references sales_order(order_id);
alter table exchange_request add foreign key (sales_order_id) references sales_order(order_id);
alter table exchange_request add foreign key (customer_id) references customer(customer_id);
alter table exchange_request add foreign key (product_id) references product(product_id);
alter table exchange_request add foreign key (approved_by) references "user"(user_id);
alter table exchange_request add foreign key (service_job_id) references service_job(job_id);
alter table refund add foreign key (payment_id) references payment(payment_id);
alter table refund add foreign key (authorised_by) references "user"(user_id);
alter table refund add foreign key (exchange_request_id) references exchange_request(request_id);
alter table complaint add foreign key (customer_id) references customer(customer_id);
alter table complaint add foreign key (logged_by) references "user"(user_id);
alter table complaint add foreign key (service_job_id) references service_job(job_id);
alter table service_job add foreign key (sales_order_id) references sales_order(order_id);
alter table service_job add foreign key (technician_id) references technician(technician_id);
alter table service_visit_log add foreign key (service_job_id) references service_job(job_id);
alter table service_visit_log add foreign key (logged_by) references "user"(user_id);
alter table spare_part_request add foreign key (service_job_id) references service_job(job_id);
alter table spare_part_request add foreign key (product_id) references product(product_id);
alter table spare_part_request add foreign key (issued_by) references "user"(user_id);
alter table quotation add foreign key (supplier_id) references supplier(supplier_id);
alter table purchase_order add foreign key (supplier_id) references supplier(supplier_id);
alter table purchase_order add foreign key (created_by) references "user"(user_id);
alter table purchase_order add foreign key (quotation_id) references quotation(quotation_id);
alter table purchase_order_item add foreign key (po_id) references purchase_order(po_id);
alter table purchase_order_item add foreign key (product_id) references product(product_id);
alter table payable add foreign key (po_id) references purchase_order(po_id);
alter table payable add foreign key (supplier_id) references supplier(supplier_id);
alter table payment add foreign key (invoice_id) references invoice(invoice_id);
alter table payment add foreign key (payable_id) references payable(payable_id);
alter table payment add foreign key (recorded_by) references "user"(user_id);
alter table transaction add foreign key (payment_id) references payment(payment_id);
alter table transaction add foreign key (invoice_id) references invoice(invoice_id);
alter table technician add foreign key (user_id) references "user"(user_id);

-- Row Level Security: only signed-in staff can use the data.
-- Tighten these per role (Admin, Storekeeper, Cashier, ...) before going live.
alter table "user" enable row level security;
create policy "staff can read user" on "user" for select to authenticated using (true);
create policy "staff can write user" on "user" for all to authenticated using (true) with check (true);
alter table role enable row level security;
create policy "staff can read role" on role for select to authenticated using (true);
create policy "staff can write role" on role for all to authenticated using (true) with check (true);
alter table permission enable row level security;
create policy "staff can read permission" on permission for select to authenticated using (true);
create policy "staff can write permission" on permission for all to authenticated using (true) with check (true);
alter table role_permission enable row level security;
create policy "staff can read role_permission" on role_permission for select to authenticated using (true);
create policy "staff can write role_permission" on role_permission for all to authenticated using (true) with check (true);
alter table system_setting enable row level security;
create policy "staff can read system_setting" on system_setting for select to authenticated using (true);
create policy "staff can write system_setting" on system_setting for all to authenticated using (true) with check (true);
alter table report enable row level security;
create policy "staff can read report" on report for select to authenticated using (true);
create policy "staff can write report" on report for all to authenticated using (true) with check (true);
alter table category enable row level security;
create policy "staff can read category" on category for select to authenticated using (true);
create policy "staff can write category" on category for all to authenticated using (true) with check (true);
alter table product enable row level security;
create policy "staff can read product" on product for select to authenticated using (true);
create policy "staff can write product" on product for all to authenticated using (true) with check (true);
alter table batch enable row level security;
create policy "staff can read batch" on batch for select to authenticated using (true);
create policy "staff can write batch" on batch for all to authenticated using (true) with check (true);
alter table stock_movement enable row level security;
create policy "staff can read stock_movement" on stock_movement for select to authenticated using (true);
create policy "staff can write stock_movement" on stock_movement for all to authenticated using (true) with check (true);
alter table stock_alert enable row level security;
create policy "staff can read stock_alert" on stock_alert for select to authenticated using (true);
create policy "staff can write stock_alert" on stock_alert for all to authenticated using (true) with check (true);
alter table returned_item enable row level security;
create policy "staff can read returned_item" on returned_item for select to authenticated using (true);
create policy "staff can write returned_item" on returned_item for all to authenticated using (true) with check (true);
alter table customer enable row level security;
create policy "staff can read customer" on customer for select to authenticated using (true);
create policy "staff can write customer" on customer for all to authenticated using (true) with check (true);
alter table credit_account enable row level security;
create policy "staff can read credit_account" on credit_account for select to authenticated using (true);
create policy "staff can write credit_account" on credit_account for all to authenticated using (true) with check (true);
alter table sales_order enable row level security;
create policy "staff can read sales_order" on sales_order for select to authenticated using (true);
create policy "staff can write sales_order" on sales_order for all to authenticated using (true) with check (true);
alter table sales_order_item enable row level security;
create policy "staff can read sales_order_item" on sales_order_item for select to authenticated using (true);
create policy "staff can write sales_order_item" on sales_order_item for all to authenticated using (true) with check (true);
alter table invoice enable row level security;
create policy "staff can read invoice" on invoice for select to authenticated using (true);
create policy "staff can write invoice" on invoice for all to authenticated using (true) with check (true);
alter table discount enable row level security;
create policy "staff can read discount" on discount for select to authenticated using (true);
create policy "staff can write discount" on discount for all to authenticated using (true) with check (true);
alter table warranty_record enable row level security;
create policy "staff can read warranty_record" on warranty_record for select to authenticated using (true);
create policy "staff can write warranty_record" on warranty_record for all to authenticated using (true) with check (true);
alter table exchange_request enable row level security;
create policy "staff can read exchange_request" on exchange_request for select to authenticated using (true);
create policy "staff can write exchange_request" on exchange_request for all to authenticated using (true) with check (true);
alter table refund enable row level security;
create policy "staff can read refund" on refund for select to authenticated using (true);
create policy "staff can write refund" on refund for all to authenticated using (true) with check (true);
alter table complaint enable row level security;
create policy "staff can read complaint" on complaint for select to authenticated using (true);
create policy "staff can write complaint" on complaint for all to authenticated using (true) with check (true);
alter table service_job enable row level security;
create policy "staff can read service_job" on service_job for select to authenticated using (true);
create policy "staff can write service_job" on service_job for all to authenticated using (true) with check (true);
alter table service_visit_log enable row level security;
create policy "staff can read service_visit_log" on service_visit_log for select to authenticated using (true);
create policy "staff can write service_visit_log" on service_visit_log for all to authenticated using (true) with check (true);
alter table spare_part_request enable row level security;
create policy "staff can read spare_part_request" on spare_part_request for select to authenticated using (true);
create policy "staff can write spare_part_request" on spare_part_request for all to authenticated using (true) with check (true);
alter table supplier enable row level security;
create policy "staff can read supplier" on supplier for select to authenticated using (true);
create policy "staff can write supplier" on supplier for all to authenticated using (true) with check (true);
alter table quotation enable row level security;
create policy "staff can read quotation" on quotation for select to authenticated using (true);
create policy "staff can write quotation" on quotation for all to authenticated using (true) with check (true);
alter table purchase_order enable row level security;
create policy "staff can read purchase_order" on purchase_order for select to authenticated using (true);
create policy "staff can write purchase_order" on purchase_order for all to authenticated using (true) with check (true);
alter table purchase_order_item enable row level security;
create policy "staff can read purchase_order_item" on purchase_order_item for select to authenticated using (true);
create policy "staff can write purchase_order_item" on purchase_order_item for all to authenticated using (true) with check (true);
alter table payable enable row level security;
create policy "staff can read payable" on payable for select to authenticated using (true);
create policy "staff can write payable" on payable for all to authenticated using (true) with check (true);
alter table payment enable row level security;
create policy "staff can read payment" on payment for select to authenticated using (true);
create policy "staff can write payment" on payment for all to authenticated using (true) with check (true);
alter table transaction enable row level security;
create policy "staff can read transaction" on transaction for select to authenticated using (true);
create policy "staff can write transaction" on transaction for all to authenticated using (true) with check (true);
alter table technician enable row level security;
create policy "staff can read technician" on technician for select to authenticated using (true);
create policy "staff can write technician" on technician for all to authenticated using (true) with check (true);

-- Create the "user" profile row automatically when a staff account is created in Supabase Auth
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public."user" (user_id, email, full_name, created_at, is_active, is_locked)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), now(), true, false);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
