-- 1. Create a secure function to check Admin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- We use a direct query. Since this function is SECURITY DEFINER, 
  -- it runs with the privileges of the creator (postgres/superuser), bypassing RLS.
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND role = 'ADMIN'
      AND status = 'ATIVO'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Policies to use is_admin()

DROP POLICY IF EXISTS "View Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Update Profiles" ON public.user_profiles;

-- SELECT: Users see themselves, Admins see everyone
CREATE POLICY "View Profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (public.is_admin())
);

-- UPDATE: Users update themselves, Admins update everyone
-- (Column protection still handled by Trigger)
CREATE POLICY "Update Profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (public.is_admin())
);

-- Note: The Insert policy and Trigger remain as is.
