alter table public.appointments
  alter column user_id drop not null;

alter table public.appointments
  add column if not exists customer_email text not null default '';

create index if not exists appointments_customer_email_idx
  on public.appointments(lower(customer_email));

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
  if new.user_id is null and (select auth.uid()) is not null then
    new.user_id = (select auth.uid());
  end if;

  if new.user_id is not null
    and ((select auth.uid()) is null or (new.user_id <> (select auth.uid()) and not private.is_admin())) then
    raise exception 'You can only book appointments for your own account.'
      using errcode = '42501';
  end if;

  if nullif(trim(new.customer_email), '') is null then
    raise exception 'Customer email is required.';
  end if;

  new.customer_email = lower(trim(new.customer_email));

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

grant insert on public.appointments to anon;
grant execute on function private.get_available_slots_impl(uuid, uuid, date) to anon;
grant execute on function public.get_available_slots(uuid, uuid, date) to anon;

drop policy if exists "Guests can create pending appointments" on public.appointments;

create policy "Guests can create pending appointments"
on public.appointments
for insert
to anon
with check (
  user_id is null
  and status = 'pending'
  and nullif(trim(customer_email), '') is not null
);
