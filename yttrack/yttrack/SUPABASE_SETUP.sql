-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Songs table
create table if not exists songs (
  id uuid default gen_random_uuid() primary key,
  video_id text unique not null,
  title text not null,
  channel text,
  yt_url text,
  genre text,
  play_count integer default 1,
  is_favorite boolean default false,
  last_played_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Playlists table
create table if not exists playlists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text default '🎵',
  created_at timestamptz default now()
);

-- Playlist songs join table
create table if not exists playlist_songs (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references playlists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  added_at timestamptz default now(),
  unique(playlist_id, song_id)
);

-- Enable Row Level Security (open access for personal use)
alter table songs enable row level security;
alter table playlists enable row level security;
alter table playlist_songs enable row level security;

-- Allow all operations with anon key (personal use)
create policy "Allow all on songs" on songs for all using (true) with check (true);
create policy "Allow all on playlists" on playlists for all using (true) with check (true);
create policy "Allow all on playlist_songs" on playlist_songs for all using (true) with check (true);

-- Enable realtime for live dashboard updates
alter publication supabase_realtime add table songs;
