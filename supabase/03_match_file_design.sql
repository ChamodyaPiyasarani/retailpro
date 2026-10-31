-- ============================================================
-- Step 3 – make the database match the File Design.
-- Run AFTER schema.sql and 02_app_columns.sql.
-- Supabase: SQL Editor > New query > paste > Run. Your data is kept.
-- Safe to run more than once.
--
--  * primary keys and staff (user) foreign keys get the File Design names
--  * Role_permission gets granted_date and access_type
--  * data types: rating NUMERIC(2,1), payment_terms INTEGER, long text VARCHAR(500)
--  * the multivalued attribute "specialisation" of Technician gets its own
--    table Technician_specialisation (one row per skill)
--  * values that only the screens use move into the "details" JSON column
-- ============================================================

-- small helpers (removed again at the end)
create or replace function pg_temp.has_col(t text, c text) returns boolean language sql as $$
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = c) $$;
create or replace function pg_temp.rename_col(t text, old_c text, new_c text) returns void language plpgsql as $$
begin
  if pg_temp.has_col(t, old_c) and not pg_temp.has_col(t, new_c) then
    execute format('alter table %I rename column %I to %I', t, old_c, new_c);
  end if;
end $$;
-- copy a column into details->>key, then drop the column
create or replace function pg_temp.to_details(t text, c text, k text) returns void language plpgsql as $$
begin
  if pg_temp.has_col(t, c) then
    execute format('update %I set details = coalesce(details, ''{}''::jsonb) || jsonb_build_object(%L, %I) where %I is not null', t, k, c, c);
    execute format('alter table %I drop column %I', t, c);
  end if;
end $$;

-- 1) primary key names
select pg_temp.rename_col('sales_order', 'order_id', 'sales_order_id');
select pg_temp.rename_col('service_job', 'job_id', 'service_job_id');
select pg_temp.rename_col('exchange_request', 'request_id', 'exchange_request_id');

-- 2) the staff member of each record is "user_id" (as in the File Design)
select pg_temp.rename_col('system_setting', 'updated_by', 'user_id');
select pg_temp.rename_col('report', 'generated_by', 'user_id');
select pg_temp.rename_col('returned_item', 'received_by', 'user_id');
select pg_temp.rename_col('credit_account', 'approved_by', 'user_id');
select pg_temp.rename_col('sales_order', 'created_by', 'user_id');
select pg_temp.rename_col('exchange_request', 'approved_by', 'user_id');
select pg_temp.rename_col('refund', 'authorised_by', 'user_id');
select pg_temp.rename_col('complaint', 'logged_by', 'user_id');
select pg_temp.rename_col('service_visit_log', 'logged_by', 'user_id');
select pg_temp.rename_col('spare_part_request', 'issued_by', 'user_id');
select pg_temp.rename_col('purchase_order', 'created_by', 'user_id');
select pg_temp.rename_col('payment', 'recorded_by', 'user_id');

-- 3) screen-only values move into details
select pg_temp.to_details('category', 'icon', 'icon');
select pg_temp.to_details('product', 'icon', 'emoji');
select pg_temp.to_details('supplier', 'outstanding_amount', 'outstanding');
select pg_temp.to_details('customer', 'outstanding_balance', 'balance');
select pg_temp.to_details('purchase_order', 'approved_by', 'approvedBy');
select pg_temp.to_details('service_job', 'created_by', 'createdBy');
select pg_temp.to_details('spare_part_request', 'requested_by', 'requestedBy');

-- 4) Role_permission: the two attributes of the M:N relationship "grants"
alter table role_permission add column if not exists granted_date date default current_date;
alter table role_permission add column if not exists access_type varchar(20) default 'allow';
update role_permission set granted_date = coalesce(granted_date, current_date), access_type = coalesce(access_type, 'allow');

-- 5) data types and sizes
alter table supplier alter column rating type numeric(2,1);
alter table supplier alter column payment_terms type integer
  using nullif(regexp_replace(payment_terms::text, '[^0-9]', '', 'g'), '')::integer;
alter table system_setting    alter column setting_value     type varchar(500);
alter table system_setting    alter column warranty_terms    type varchar(500);
alter table warranty_record   alter column warranty_terms    type varchar(500);
alter table complaint         alter column description       type varchar(500);
alter table complaint         alter column resolution        type varchar(500);
alter table service_job       alter column fault_description type varchar(500);
alter table service_job       alter column resolution_notes  type varchar(500);
alter table service_visit_log alter column visit_notes       type varchar(500);
alter table audit_log         alter column detail            type varchar(500);

-- 6) multivalued attribute: one row per technician skill
create table if not exists technician_specialisation (
  technician_id bigint not null references technician(technician_id) on delete cascade,
  specialisation varchar(50) not null,
  primary key (technician_id, specialisation)
);
alter table technician_specialisation enable row level security;
drop policy if exists "staff can read technician_specialisation" on technician_specialisation;
drop policy if exists "staff can write technician_specialisation" on technician_specialisation;
create policy "staff can read technician_specialisation" on technician_specialisation for select to authenticated using (true);
create policy "staff can write technician_specialisation" on technician_specialisation for all to authenticated using (true) with check (true);
do $$
begin
  if pg_temp.has_col('technician', 'specialisation') then
    insert into technician_specialisation (technician_id, specialisation)
    select t.technician_id, trim(s)
    from technician t, unnest(string_to_array(t.specialisation, ',')) s
    where trim(s) <> ''
    on conflict do nothing;
    alter table technician drop column specialisation;
  end if;
end $$;

-- 7) id counters follow the renamed primary keys
drop trigger if exists keep_id_sequence on sales_order;
create trigger keep_id_sequence after insert on sales_order for each statement execute function public.keep_id_sequence('sales_order_id');
drop trigger if exists keep_id_sequence on service_job;
create trigger keep_id_sequence after insert on service_job for each statement execute function public.keep_id_sequence('service_job_id');
drop trigger if exists keep_id_sequence on exchange_request;
create trigger keep_id_sequence after insert on exchange_request for each statement execute function public.keep_id_sequence('exchange_request_id');

-- check: should list the new names
select table_name, column_name from information_schema.columns
where table_schema = 'public'
  and ((table_name, column_name) in (('sales_order','sales_order_id'), ('service_job','service_job_id'), ('exchange_request','exchange_request_id'),
       ('role_permission','granted_date'), ('role_permission','access_type'), ('technician_specialisation','specialisation')))
order by 1, 2;
