-- ============================================================
-- Fix: brands table RLS policies + admin bootstrap guarantee
-- ============================================================

-- 1. Drop any existing policies on brands (idempotent)
DROP POLICY IF EXISTS "ATIVO users can view brands"       ON public.brands;
DROP POLICY IF EXISTS "ADMIN can insert brands"           ON public.brands;
DROP POLICY IF EXISTS "ADMIN can update brands"           ON public.brands;
DROP POLICY IF EXISTS "ADMIN can delete brands"           ON public.brands;
DROP POLICY IF EXISTS "Active users can view brands"      ON public.brands;
DROP POLICY IF EXISTS "Admins can manage brands"          ON public.brands;

-- 2. Enable RLS on brands (safe to call even if already enabled)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 3. SELECT: any ATIVO user can list brands (needed for product forms etc)
CREATE POLICY "Active users can view brands"
ON public.brands
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND status = 'ATIVO'
  )
);

-- 4. INSERT: only ADMIN can create brands
CREATE POLICY "Admins can insert brands"
ON public.brands
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'
  )
);

-- 5. UPDATE: only ADMIN can edit brands
CREATE POLICY "Admins can update brands"
ON public.brands
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'
  )
);

-- 6. DELETE: only ADMIN can remove brands
CREATE POLICY "Admins can delete brands"
ON public.brands
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'
  )
);

-- ============================================================
-- 7. Re-guarantee root admin bootstrap (idempotent)
--    Runs via service-role so it bypasses RLS + the protect trigger.
-- ============================================================
DO $$
DECLARE
  target_email TEXT := 'contato.matheusfontanin@gmail.com';
  target_uid   UUID;
BEGIN
  SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

  IF target_uid IS NOT NULL THEN
    -- Bypass the protect_sensitive_columns trigger by using ALTER TABLE
    -- Actually we use a direct UPDATE bypassing trigger by using security definer context.
    -- Since this DO block runs as superuser/service role, it bypasses RLS but NOT triggers.
    -- We temporarily disable the trigger for this one update.
    ALTER TABLE public.user_profiles DISABLE TRIGGER trg_protect_sensitive_columns;

    INSERT INTO public.user_profiles (user_id, email, role, status, full_name, created_at, updated_at)
    VALUES (target_uid, target_email, 'ADMIN', 'ATIVO', 'Matheus Fontanin', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET role       = 'ADMIN',
          status     = 'ATIVO',
          updated_at = NOW();

    ALTER TABLE public.user_profiles ENABLE TRIGGER trg_protect_sensitive_columns;

    RAISE NOTICE 'Root admin bootstrapped: %', target_email;
  ELSE
    RAISE NOTICE 'Root admin not found in auth.users (email: %)', target_email;
  END IF;
END $$;
