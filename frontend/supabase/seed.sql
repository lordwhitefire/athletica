-- ── Profiles table ─────────────────────────────────────────
-- Stores extra user data linked to Supabase auth.users
create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    email text,
    avatar_url text,
    role text not null default 'customer' check (role in ('customer', 'admin')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Policies
create policy "Users can view own profile"
    on profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on profiles for update
    using (auth.uid() = id);

-- ── Auto-create profile on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, name, email)
    values (
        new.id,
        new.raw_user_meta_data ->> 'name',
        new.email
    );
    return new;
end;
$$;

-- Trigger the function every time a user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
