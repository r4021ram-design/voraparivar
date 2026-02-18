-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create people table
create table public.people (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references public.people(id),
  name text not null,
  gender text check (gender in ('MALE', 'FEMALE')),
  relation text,
  generation int,
  bio text,
  occupation text,
  dob date,
  dod date,
  anniversary_date date,
  phone text,
  location_name text,
  location_lat float8,
  location_lng float8,
  spouse_name text,
  spouse_dob date,
  spouse_dod date,
  spouse_occupation text,
  spouse_phone text,
  created_at timestamptz default now()
);

-- Create media table
create table public.media (
  id uuid primary key default uuid_generate_v4(),
  person_id uuid references public.people(id) on delete cascade,
  url text not null,
  type text check (type in ('PROFILE', 'SPOUSE_PROFILE', 'GALLERY')),
  caption text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.people enable row level security;
alter table public.media enable row level security;

-- Create policies (Allow generic read/write for now, refine later)
create policy "Allow public read access" on public.people for select using (true);
create policy "Allow public insert access" on public.people for insert with check (true);
create policy "Allow public update access" on public.people for update using (true);
create policy "Allow public delete access" on public.people for delete using (true);

create policy "Allow public read access" on public.media for select using (true);
create policy "Allow public insert access" on public.media for insert with check (true);
create policy "Allow public update access" on public.media for update using (true);
create policy "Allow public delete access" on public.media for delete using (true);

-- Create Storage Bucket for Media
insert into storage.buckets (id, name, public) values ('family-media', 'family-media', true);

-- Storage Policies
create policy "Public Access" on storage.objects for select using ( bucket_id = 'family-media' );
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'family-media' );
