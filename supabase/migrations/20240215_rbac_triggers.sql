-- 1. Create Function to Handle New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name', -- Extract name from metadata
    'LEITOR', -- Default Role
    'PENDENTE', -- Default Status
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger on auth.users
-- Drop if exists to be idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Confirmation of Root Admin Bootstrap integrity (Idempotent)
DO $$ 
DECLARE
  target_email TEXT := 'contato.matheusfontanin@gmail.com';
  target_uid UUID;
BEGIN
  -- Find the UID from auth.users
  SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

  IF target_uid IS NOT NULL THEN
    -- Force update to ensure correctness even if they were created before this trigger
    INSERT INTO public.user_profiles (user_id, email, role, status, full_name, created_at, updated_at)
    VALUES (target_uid, target_email, 'ADMIN', 'ATIVO', 'Root Admin', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE 
    SET role = 'ADMIN', status = 'ATIVO';
  END IF;
END $$;
