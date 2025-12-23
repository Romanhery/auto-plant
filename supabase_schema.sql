-- Enable RLS
alter table public.plants enable row level security;
alter table public.sensor_readings enable row level security;

-- 1. Devices Table (The Physical Entry Point)
create table if not exists public.devices (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique, -- Secure token for API Auth
  name text not null,
  mac_address text null, -- Optional metadata
  last_seen timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint devices_pkey primary key (id)
);
alter table public.devices enable row level security;

-- 2. Device Commands Table (For Remote Control)
create table if not exists public.device_commands (
  id uuid not null default gen_random_uuid (),
  device_id uuid not null references public.devices(id) on delete cascade,
  command text not null, -- 'PUMP_ON', 'PUMP_OFF', 'LED_ON', 'LED_OFF'
  payload jsonb null, -- Optional params like color or duration
  status text not null default 'pending', -- 'pending', 'executed', 'failed'
  created_at timestamp with time zone null default now(),
  executed_at timestamp with time zone null,
  constraint device_commands_pkey primary key (id)
);
alter table public.device_commands enable row level security;

-- 3. Plants Table (Modified to link to devices.id)
create table if not exists public.plants (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plant_type text not null default 'Unknown',
  
  -- Link to the Device Table instead of a raw string
  device_id uuid null references public.devices(id) on delete set null,
  
  preset_id integer null, 
  image_url text null,
  location text null,
  is_automatic_mode boolean null default true,
  target_moisture integer null default 50,
  target_light_hours integer null default 12,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint plants_pkey primary key (id)
);

-- 4. Sensor Readings Table (Linked to Device)
create table if not exists public.sensor_readings (
  id uuid not null default gen_random_uuid (),
  device_id uuid not null references public.devices(id) on delete cascade,
  plant_id uuid null references public.plants(id) on delete set null, -- Optional link to specific plant
  temperature numeric(4, 1) null,
  humidity numeric(4, 1) null,
  soil_moisture numeric(4, 1) null,
  timestamp timestamp with time zone null default now(),
  constraint sensor_readings_pkey primary key (id)
);

-- Indexes
create index if not exists idx_readings_device_id on public.sensor_readings (device_id);
create index if not exists idx_readings_timestamp on public.sensor_readings ("timestamp" desc);

-- RLS Policies

-- Devices: Users can only see/edit their own
create policy "Users can view own devices" on public.devices for select using (auth.uid() = user_id);
create policy "Users can insert own devices" on public.devices for insert with check (auth.uid() = user_id);
create policy "Users can update own devices" on public.devices for update using (auth.uid() = user_id);
create policy "Users can delete own devices" on public.devices for delete using (auth.uid() = user_id);

-- Commands: Users can insert commands for their own devices
create policy "Users can view commands for own devices" on public.device_commands 
  for select using (exists (select 1 from public.devices where devices.id = device_commands.device_id and devices.user_id = auth.uid()));
create policy "Users can insert commands for own devices" on public.device_commands 
  for insert with check (exists (select 1 from public.devices where devices.id = device_commands.device_id and devices.user_id = auth.uid()));

-- Plants: Standard User ownership
create policy "Users can view own plants" on public.plants for select using (auth.uid() = user_id);
create policy "Users can insert own plants" on public.plants for insert with check (auth.uid() = user_id);
create policy "Users can update own plants" on public.plants for update using (auth.uid() = user_id);
create policy "Users can delete own plants" on public.plants for delete using (auth.uid() = user_id);

-- Sensor Readings: Viewable by owner of the device
create policy "Users can view readings from own devices" on public.sensor_readings 
  for select using (exists (select 1 from public.devices where devices.id = sensor_readings.device_id and devices.user_id = auth.uid()));

-- NOTE: The API (Service Role) will handle insertions for readings and checking commands, ensuring RLS doesn't block device operations.

