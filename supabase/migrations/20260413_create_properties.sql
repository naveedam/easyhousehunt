create table if not exists properties (
  id uuid primary key default gen_random_uuid(),

  title text,
  society text,
  bhk int,
  rent int,
  deposit int,
  furnishing text,
  area int,

  latitude float8,
  longitude float8,

  amenities text[],

  created_at timestamp default now()
);