create extension if not exists pgcrypto;

create table if not exists public.feedback_requests (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    message text not null,
    personal_data_consent boolean not null default false,
    terms_consent boolean not null default false,
    source_page text,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.restaurants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    cuisine text,
    short_description text,
    image_url text,
    image_url_2 text,
    image_url_3 text,
    website_url text,
    is_published boolean not null default true,
    sort_order integer not null default 100,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.restaurants
    add column if not exists image_url_2 text,
    add column if not exists image_url_3 text;

create index if not exists feedback_requests_created_at_idx
    on public.feedback_requests (created_at desc);

create index if not exists restaurants_sort_order_idx
    on public.restaurants (sort_order asc, created_at desc);

alter table public.feedback_requests enable row level security;
alter table public.restaurants enable row level security;

drop policy if exists "anon can insert feedback requests" on public.feedback_requests;
create policy "anon can insert feedback requests"
on public.feedback_requests
for insert
to anon
with check (
    personal_data_consent = true
    and terms_consent = true
    and char_length(trim(name)) > 1
    and char_length(trim(email)) > 4
    and char_length(trim(message)) > 5
);

drop policy if exists "anon can read published restaurants" on public.restaurants;
create policy "anon can read published restaurants"
on public.restaurants
for select
to anon
using (is_published = true);

insert into public.restaurants (name, cuisine, short_description, image_url, website_url, sort_order)
values
    ('Nordic Bowl', 'Авторские боулы', 'Свежие боулы и салаты с яркой подачей.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80', 'https://example.com', 10),
    ('Pasta Fresca', 'Итальянская кухня', 'Домашняя паста, соусы и десерты на каждый день.', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80', 'https://example.com', 20),
    ('Tokyo Roll Lab', 'Японская кухня', 'Роллы, поке и тёплые блюда с аккуратной подачей.', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80', 'https://example.com', 30),
    ('Grill & Fire', 'Гриль и бургеры', 'Сочные бургеры и мясо на открытом огне.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', 'https://example.com', 40)
on conflict do nothing;
