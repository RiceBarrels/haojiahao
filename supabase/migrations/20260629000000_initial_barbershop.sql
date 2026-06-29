create extension if not exists pgcrypto;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

create schema if not exists private;

create type public.profile_role as enum ('customer', 'admin');
create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  role public.profile_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text not null,
  description_zh text not null default '',
  description_en text not null default '',
  duration_minutes integer not null check (duration_minutes between 10 and 480),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stylists (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text not null,
  bio_zh text not null default '',
  bio_en text not null default '',
  photo_url text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stylist_availability (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.stylist_time_off (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  off_date date not null,
  all_day boolean not null default true,
  start_time time,
  end_time time,
  reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    all_day
    or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stylist_id uuid not null references public.stylists(id),
  service_id uuid not null references public.services(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  customer_name text not null,
  customer_phone text not null,
  note text not null default '',
  status public.appointment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

alter table public.appointments
  add constraint appointments_user_profile_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

create index appointments_user_id_idx on public.appointments(user_id);
create index appointments_service_id_idx on public.appointments(service_id);
create index appointments_stylist_date_idx on public.appointments(stylist_id, appointment_date);
create index stylist_availability_lookup_idx
  on public.stylist_availability(stylist_id, day_of_week, active);
create index stylist_time_off_lookup_idx
  on public.stylist_time_off(stylist_id, off_date);
create unique index appointments_unique_active_start_idx
  on public.appointments(stylist_id, appointment_date, start_time)
  where status <> 'cancelled';
alter table public.appointments
  add constraint appointments_no_stylist_overlap
  exclude using gist (
    stylist_id with =,
    tsrange(appointment_date + start_time, appointment_date + end_time, '[)') with &&
  )
  where (status <> 'cancelled');

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function private.set_updated_at();

create trigger stylists_set_updated_at
before update on public.stylists
for each row execute function private.set_updated_at();

create trigger stylist_availability_set_updated_at
before update on public.stylist_availability
for each row execute function private.set_updated_at();

create trigger stylist_time_off_set_updated_at
before update on public.stylist_time_off
for each row execute function private.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function private.set_updated_at();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, phone, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Customer'
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      new.phone,
      ''
    ),
    'customer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function private.promote_user_to_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  promoted_user_id uuid;
begin
  select id
  into promoted_user_id
  from auth.users
  where lower(email) = lower(p_email)
  order by created_at
  limit 1;

  if promoted_user_id is null then
    raise exception 'No auth user found for email %', p_email;
  end if;

  insert into public.profiles (id, display_name, phone, role)
  select
    id,
    coalesce(
      nullif(raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(email, '@', 1), ''),
      'Admin'
    ),
    coalesce(
      nullif(raw_user_meta_data ->> 'phone', ''),
      phone,
      ''
    ),
    'admin'
  from auth.users
  where id = promoted_user_id
  on conflict (id) do update
  set role = 'admin',
      updated_at = now();

  return promoted_user_id;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.prepare_appointment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  service_duration integer;
  service_is_active boolean;
  stylist_is_active boolean;
  appt_start timestamp;
  appt_end timestamp;
  has_availability boolean;
  has_time_off boolean;
  has_conflict boolean;
  local_today date;
  local_cutoff time;
begin
  if new.user_id is null then
    new.user_id = (select auth.uid());
  end if;

  if (select auth.uid()) is null then
    raise exception 'You must be signed in to book an appointment.'
      using errcode = '42501';
  end if;

  if new.user_id <> (select auth.uid()) and not private.is_admin() then
    raise exception 'You can only book appointments for your own account.'
      using errcode = '42501';
  end if;

  select duration_minutes, active
  into service_duration, service_is_active
  from public.services
  where id = new.service_id;

  if service_duration is null or service_is_active is not true then
    raise exception 'Selected service is not available.';
  end if;

  select active
  into stylist_is_active
  from public.stylists
  where id = new.stylist_id;

  if stylist_is_active is not true then
    raise exception 'Selected stylist is not available.';
  end if;

  local_today = (now() at time zone 'America/New_York')::date;
  local_cutoff = ((now() at time zone 'America/New_York') + interval '30 minutes')::time;

  if new.appointment_date < local_today then
    raise exception 'Appointment date must be today or later.';
  end if;

  if new.appointment_date = local_today and new.start_time < local_cutoff then
    raise exception 'Appointment time must be at least 30 minutes from now.';
  end if;

  if extract(minute from new.start_time)::integer % 30 <> 0
    or extract(second from new.start_time)::integer <> 0 then
    raise exception 'Appointment time must start on a 30-minute increment.';
  end if;

  new.end_time = (new.start_time + make_interval(mins => service_duration))::time;

  if new.end_time <= new.start_time then
    raise exception 'Appointment must end on the same day.';
  end if;

  appt_start = new.appointment_date + new.start_time;
  appt_end = new.appointment_date + new.end_time;

  select exists (
    select 1
    from public.stylist_availability availability
    where availability.stylist_id = new.stylist_id
      and availability.active
      and availability.day_of_week = extract(dow from new.appointment_date)::smallint
      and availability.start_time <= new.start_time
      and availability.end_time >= new.end_time
  )
  into has_availability;

  if not has_availability then
    raise exception 'Selected stylist is not available at that time.';
  end if;

  select exists (
    select 1
    from public.stylist_time_off time_off
    where time_off.stylist_id = new.stylist_id
      and time_off.off_date = new.appointment_date
      and (
        time_off.all_day
        or tsrange(
          new.appointment_date + time_off.start_time,
          new.appointment_date + time_off.end_time,
          '[)'
        ) && tsrange(appt_start, appt_end, '[)')
      )
  )
  into has_time_off;

  if has_time_off then
    raise exception 'Selected stylist is off at that time.';
  end if;

  select exists (
    select 1
    from public.appointments existing
    where existing.stylist_id = new.stylist_id
      and existing.appointment_date = new.appointment_date
      and existing.status <> 'cancelled'
      and existing.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and tsrange(
        existing.appointment_date + existing.start_time,
        existing.appointment_date + existing.end_time,
        '[)'
      ) && tsrange(appt_start, appt_end, '[)')
  )
  into has_conflict;

  if has_conflict then
    raise exception 'That appointment time is already booked.';
  end if;

  return new;
end;
$$;

create trigger appointments_prepare
before insert or update of stylist_id, service_id, appointment_date, start_time, user_id
on public.appointments
for each row execute function private.prepare_appointment();

create or replace function private.get_available_slots_impl(
  p_stylist_id uuid,
  p_service_id uuid,
  p_appointment_date date
)
returns table(slot_time time)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  service_duration integer;
  availability_row record;
  cursor_start timestamp;
  candidate_end timestamp;
  day_start timestamp;
  day_end timestamp;
  today_cutoff time;
begin
  if (select auth.uid()) is null then
    return;
  end if;

  if p_appointment_date < (now() at time zone 'America/New_York')::date then
    return;
  end if;

  select duration_minutes
  into service_duration
  from public.services
  where id = p_service_id
    and active;

  if service_duration is null then
    return;
  end if;

  if not exists (
    select 1 from public.stylists where id = p_stylist_id and active
  ) then
    return;
  end if;

  today_cutoff = ((now() at time zone 'America/New_York') + interval '30 minutes')::time;

  for availability_row in
    select start_time, end_time
    from public.stylist_availability
    where stylist_id = p_stylist_id
      and active
      and day_of_week = extract(dow from p_appointment_date)::smallint
    order by start_time
  loop
    day_start = p_appointment_date + availability_row.start_time;
    day_end = p_appointment_date + availability_row.end_time;
    cursor_start = day_start;

    while cursor_start + make_interval(mins => service_duration) <= day_end loop
      candidate_end = cursor_start + make_interval(mins => service_duration);

      if (
        p_appointment_date > (now() at time zone 'America/New_York')::date
        or cursor_start::time >= today_cutoff
      )
      and not exists (
        select 1
        from public.stylist_time_off time_off
        where time_off.stylist_id = p_stylist_id
          and time_off.off_date = p_appointment_date
          and (
            time_off.all_day
            or tsrange(
              p_appointment_date + time_off.start_time,
              p_appointment_date + time_off.end_time,
              '[)'
            ) && tsrange(cursor_start, candidate_end, '[)')
          )
      )
      and not exists (
        select 1
        from public.appointments appointment
        where appointment.stylist_id = p_stylist_id
          and appointment.appointment_date = p_appointment_date
          and appointment.status <> 'cancelled'
          and tsrange(
            appointment.appointment_date + appointment.start_time,
            appointment.appointment_date + appointment.end_time,
            '[)'
          ) && tsrange(cursor_start, candidate_end, '[)')
      ) then
        slot_time = cursor_start::time;
        return next;
      end if;

      cursor_start = cursor_start + interval '30 minutes';
    end loop;
  end loop;
end;
$$;

create or replace function public.get_available_slots(
  p_stylist_id uuid,
  p_service_id uuid,
  p_appointment_date date
)
returns table(slot_time time)
language sql
stable
security invoker
set search_path = public, private, pg_temp
as $$
  select slot_time
  from private.get_available_slots_impl(
    p_stylist_id,
    p_service_id,
    p_appointment_date
  );
$$;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.stylists enable row level security;
alter table public.stylist_availability enable row level security;
alter table public.stylist_time_off enable row level security;
alter table public.appointments enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to anon, authenticated, service_role;

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.services to anon, authenticated;
grant select on public.stylists to anon, authenticated;
grant select on public.stylist_availability to anon, authenticated;
grant select on public.stylist_time_off to authenticated;
grant select, insert, update on public.appointments to authenticated;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.services to authenticated, service_role;
grant select, insert, update, delete on public.stylists to authenticated, service_role;
grant select, insert, update, delete on public.stylist_availability to authenticated, service_role;
grant select, insert, update, delete on public.stylist_time_off to authenticated, service_role;
grant select, insert, update, delete on public.appointments to authenticated, service_role;

grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.get_available_slots_impl(uuid, uuid, date) to authenticated;
grant execute on function public.get_available_slots(uuid, uuid, date) to authenticated;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.prepare_appointment() from public, anon, authenticated;
revoke all on function private.promote_user_to_admin(text) from public, anon, authenticated;
revoke all on function private.get_available_slots_impl(uuid, uuid, date) from public, anon;
revoke execute on function public.get_available_slots(uuid, uuid, date) from public, anon;
grant execute on function private.promote_user_to_admin(text) to service_role;

create policy "Customers can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id or private.is_admin());

create policy "Admins can insert profiles"
on public.profiles
for insert
to authenticated
with check (private.is_admin());

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins can delete profiles"
on public.profiles
for delete
to authenticated
using (private.is_admin());

create policy "Anyone can read active services"
on public.services
for select
to anon, authenticated
using (active or private.is_admin());

create policy "Admins can insert services"
on public.services
for insert
to authenticated
with check (private.is_admin());

create policy "Admins can update services"
on public.services
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins can delete services"
on public.services
for delete
to authenticated
using (private.is_admin());

create policy "Anyone can read active stylists"
on public.stylists
for select
to anon, authenticated
using (active or private.is_admin());

create policy "Admins can insert stylists"
on public.stylists
for insert
to authenticated
with check (private.is_admin());

create policy "Admins can update stylists"
on public.stylists
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins can delete stylists"
on public.stylists
for delete
to authenticated
using (private.is_admin());

create policy "Anyone can read active availability"
on public.stylist_availability
for select
to anon, authenticated
using (active or private.is_admin());

create policy "Admins can insert availability"
on public.stylist_availability
for insert
to authenticated
with check (private.is_admin());

create policy "Admins can update availability"
on public.stylist_availability
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins can delete availability"
on public.stylist_availability
for delete
to authenticated
using (private.is_admin());

create policy "Admins can select stylist time off"
on public.stylist_time_off
for select
to authenticated
using (private.is_admin());

create policy "Admins can insert stylist time off"
on public.stylist_time_off
for insert
to authenticated
with check (private.is_admin());

create policy "Admins can update stylist time off"
on public.stylist_time_off
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins can delete stylist time off"
on public.stylist_time_off
for delete
to authenticated
using (private.is_admin());

create policy "Customers can create their appointments"
on public.appointments
for insert
to authenticated
with check (
  ((select auth.uid()) = user_id and status = 'pending')
  or private.is_admin()
);

create policy "Customers can read their appointments"
on public.appointments
for select
to authenticated
using ((select auth.uid()) = user_id or private.is_admin());

create policy "Authenticated users can update permitted appointments"
on public.appointments
for update
to authenticated
using (
  private.is_admin()
  or ((select auth.uid()) = user_id and status in ('pending', 'confirmed'))
)
with check (
  private.is_admin()
  or ((select auth.uid()) = user_id and status = 'cancelled')
);

create policy "Admins can delete appointments"
on public.appointments
for delete
to authenticated
using (private.is_admin());

with seeded_services as (
  insert into public.services
    (name_zh, name_en, description_zh, description_en, duration_minutes, price_cents, sort_order)
  values
    ('男士精剪', 'Men''s haircut', '含基础修剪与造型整理', 'Classic cut with light styling', 30, 2800, 10),
    ('女士精剪', 'Women''s haircut', '按发量与长度沟通层次和线条', 'Shape and layers tailored to length and texture', 45, 3800, 20),
    ('儿童剪发', 'Kids haircut', '适合 12 岁及以下儿童', 'For children 12 and under', 25, 2200, 30),
    ('洗吹造型', 'Wash and blowout', '洗发、吹整与日常造型', 'Shampoo, blow dry, and everyday styling', 40, 3500, 40),
    ('染发咨询', 'Color consultation', '现场沟通颜色、发质和预计时间', 'Color, hair condition, and timing consultation', 60, 8000, 50)
  returning 1
),
seeded_services_count as (
  select count(*) from seeded_services
),
seeded_stylists as (
  insert into public.stylists
    (name_zh, name_en, bio_zh, bio_en, sort_order)
  values
    ('好师傅', 'Hao', '擅长自然层次、男士精剪与家庭理发需求。', 'Focused on natural layers, men''s cuts, and family appointments.', 10),
    ('佳师傅', 'Jia', '擅长女士修剪、洗吹造型和细致沟通。', 'Focused on women''s cuts, blowouts, and careful consultation.', 20)
  returning id, sort_order
)
insert into public.stylist_availability (stylist_id, day_of_week, start_time, end_time)
select id, days.day_of_week, time '10:00', time '19:00'
from seeded_stylists
cross join seeded_services_count
cross join generate_series(1, 6) as days(day_of_week);
