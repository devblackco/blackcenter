-- 1. Ensure Schema Integrity
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- 2. Drop existing policies/triggers to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "View Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Insert Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Update Own Profile Data" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Update Any Profile" ON public.user_profiles;

DROP TRIGGER IF EXISTS trg_protect_sensitive_columns ON public.user_profiles;
DROP FUNCTION IF EXISTS public.protect_sensitive_columns();

-- 3. Define Strict Policies

-- SELECT: Users see themselves, Admins see everyone
CREATE POLICY "View Profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'))
);

-- INSERT: Standard Signup (Strictly LEITOR/PENDENTE)
CREATE POLICY "Insert Own Profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  role = 'LEITOR' AND
  status = 'PENDENTE'
);

-- UPDATE: Allow Update (column protection via Trigger)
CREATE POLICY "Update Profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'))
);

-- 4. Trigger to Protect Sensitive Columns (The "Ironclad" Check)
CREATE OR REPLACE FUNCTION public.protect_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if role or status is being changed
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    -- Allow ONLY if the executing user is an ADMIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Admins can change role or status.';
    END IF;
  END IF;
  
  -- Prevent User from changing their own ID or Email (integrity)
  IF (NEW.user_id IS DISTINCT FROM OLD.user_id) OR (NEW.email IS DISTINCT FROM OLD.email) THEN
      RAISE EXCEPTION 'Unauthorized: Cannot change user_id or email directly.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_protect_sensitive_columns
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_columns();


-- 5. Bootstrap Root Admin (The "Hard Fix")
DO $$ 
DECLARE
  target_email TEXT := 'contato.matheusfontanin@gmail.com';
  target_uid UUID;
BEGIN
  -- Find the UID from auth.users
  SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

  IF target_uid IS NOT NULL THEN
    -- Upsert the profile to ADMIN/ATIVO
    INSERT INTO public.user_profiles (user_id, email, role, status, full_name, created_at, updated_at)
    VALUES (target_uid, target_email, 'ADMIN', 'ATIVO', 'Root Admin', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE 
    SET role = 'ADMIN', status = 'ATIVO', updated_at = NOW();
    
    RAISE NOTICE 'Root Admin bootstrapped successfully: %', target_email;
  ELSE
    RAISE NOTICE 'Root Admin user not found in auth.users during migration.';
  END IF;
END $$;
