-- Create user_profiles table
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'LEITOR' check (role in ('ADMIN','EXPEDICAO','LEITOR')),
  status text not null default 'PENDENTE' check (status in ('PENDENTE','ATIVO','BLOQUEADO')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Create admin_users table (whitelist)
create table if not exists public.admin_users (
  email text primary key,
  enabled boolean not null default true,
  created_at timestamptz default now()
);

-- Turn off RLS for admin_users for now (or enable and allow read for authentication trigger)
-- Actually, admin_users is mainly used by server-side trigger, but if we want admins to manage it from UI, we need policies.
alter table public.admin_users enable row level security;

-- Initial Admin
insert into public.admin_users(email) values ('dev.blackco@gmail.com') on conflict do nothing;

-- Trigger Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_admin boolean;
begin
  -- Check if email is in admin_users whitelist
  select enabled into is_admin from public.admin_users where email = new.email;

  if is_admin then
    insert into public.user_profiles (user_id, email, role, status)
    values (new.id, new.email, 'ADMIN', 'ATIVO');
  else
    insert into public.user_profiles (user_id, email, role, status)
    values (new.id, new.email, 'LEITOR', 'PENDENTE');
  end if;
  return new;
end;
$$;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for sync admins
-- If an admin is added to admin_users, we might want to update existing profiles? 
-- For MVP, let's just stick to the signup trigger + manual update via UI.

-- RLS Policies for user_profiles
-- 1. Users can view their own profile
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

-- 2. Admins can view all profiles
create policy "Admins can view all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'ADMIN' and status = 'ATIVO'
    )
  );

-- 3. Admins can update profiles
create policy "Admins can update profiles"
  on public.user_profiles for update
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'ADMIN' and status = 'ATIVO'
    )
  );

-- RLS for SKU table (assuming it exists, if not, create dummy policy or skip if table not created yet)
-- The user request says "Ativar RLS em user_profiles e sku (tabela que já existe)"
-- I'll check if sku table exists first, but I'll write the policy assuming it does.
-- "sku: somente usuários com status=ATIVO podem dar select/insert/update"

alter table if exists public.sku enable row level security;

create policy "Active users can view skus"
  on public.sku for select
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and status = 'ATIVO'
    )
  );

create policy "Active users can insert skus"
  on public.sku for insert
  with check (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and status = 'ATIVO'
    )
  );

create policy "Active users can update skus"
  on public.sku for update
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and status = 'ATIVO'
    )
  );

-- Admin users table policies
-- Admins can view admin_users
create policy "Admins can view admin_users"
    on public.admin_users for select
    using (
        exists (
            select 1 from public.user_profiles
            where user_id = auth.uid() and role = 'ADMIN' and status = 'ATIVO'
        )
    );

-- Admins can insert/update admin_users
create policy "Admins can manage admin_users"
    on public.admin_users for all
    using (
        exists (
            select 1 from public.user_profiles
            where user_id = auth.uid() and role = 'ADMIN' and status = 'ATIVO'
        )
    );
