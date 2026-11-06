-- One-time repair: remove the Kasun (tech2) technician and give his old jobs to Ruwan.
-- Sign out of the app first, then run this in Supabase SQL Editor.
begin;
-- old jobs that do not belong to a real, current technician go to Ruwan (tech@gmail.com)
update service_job
set technician_id = (select min(technician_id) from technician
                     where user_id = (select user_id from "user" where lower(email) = 'tech@gmail.com'))
where technician_id in (
        select technician_id from technician
        where user_id is null
           or user_id in (select user_id from "user" where lower(email) = 'tech2@gmail.com'))
   or (technician_id in (select technician_id from technician
                         where user_id = (select user_id from "user" where full_name ilike 'saman perera' limit 1))
       and coalesce(created_date, current_date) < (select created_at::date from "user" where full_name ilike 'saman perera' limit 1));
-- remove Kasun's technician number and switch off his account if it exists
delete from technician
where user_id is null or user_id in (select user_id from "user" where lower(email) = 'tech2@gmail.com');
update "user" set is_active = false, is_locked = true where lower(email) = 'tech2@gmail.com';
commit;

select t.technician_id, u.full_name,
       (select count(*) from service_job j where j.technician_id = t.technician_id) as jobs
from technician t left join "user" u on u.user_id = t.user_id order by 1;
