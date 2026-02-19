-- Fix: Ensure admin user has correct role/status
-- This runs as service role (bypasses RLS)

DO $$
DECLARE
  target_email TEXT := 'contato.matheusfontanin@gmail.com';
  target_uid   UUID;
BEGIN
  SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

  IF target_uid IS NOT NULL THEN
    -- Disable trigger so we can update protected columns
    ALTER TABLE public.user_profiles DISABLE TRIGGER trg_protect_sensitive_columns;

    INSERT INTO public.user_profiles (user_id, email, role, status, full_name, created_at, updated_at)
    VALUES (target_uid, target_email, 'ADMIN', 'ATIVO', 'Matheus Fontanin', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET role       = 'ADMIN',
          status     = 'ATIVO',
          updated_at = NOW();

    ALTER TABLE public.user_profiles ENABLE TRIGGER trg_protect_sensitive_columns;

    RAISE NOTICE 'Admin bootstrapped OK: %', target_email;
  ELSE
    RAISE NOTICE 'User not found in auth.users: %', target_email;
  END IF;
END $$;
