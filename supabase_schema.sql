-- Enable RLS (Optional but recommended)
-- alter table public.plants enable row level security;
-- alter table public.sensor_readings enable row level security;

-- 1. Plants Table
create table if not exists public.plants (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users(id) on delete cascade, -- Or references public.profiles(id)
  name text not null,
  plant_type text not null default 'Unknown',
  device_id text not null,
  preset_id integer null, -- References plant_presets(id) if exists
  image_url text null,
  location text null,
  is_automatic_mode boolean null default true,
  target_moisture integer null default 50,
  target_light_hours integer null default 12,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint plants_pkey primary key (id),
  constraint plants_device_id_key unique (device_id)
);

-- 2. Sensor Readings Table
create table if not exists public.sensor_readings (
  id uuid not null default gen_random_uuid (),
  plant_id uuid null references public.plants(id) on delete cascade,
  temperature numeric(4, 1) null,
  humidity numeric(4, 1) null,
  soil_moisture numeric(4, 1) null,
  timestamp timestamp with time zone null default now(),
  device_id text null, -- Used for linking
  constraint sensor_readings_pkey primary key (id)
);

-- 3. Indexes for Performance
create index if not exists idx_sensor_readings_plant_id on public.sensor_readings (plant_id);
create index if not exists idx_sensor_readings_timestamp on public.sensor_readings ("timestamp" desc);
create index if not exists idx_sensor_readings_plant_timestamp on public.sensor_readings (plant_id, "timestamp" desc);

-- 4. Function to Link Device ID to Plant ID automatically
create or replace function link_device_to_plant()
returns trigger as $$
begin
  -- If plant_id is missing but device_id is present, try to find the plant
  if new.plant_id is null and new.device_id is not null then
    select id into new.plant_id from public.plants where device_id = new.device_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- 5. Trigger to run the function before insertion
drop trigger if exists trigger_auto_link_plant on public.sensor_readings;
create trigger trigger_auto_link_plant
before insert on public.sensor_readings
for each row execute function link_device_to_plant();
