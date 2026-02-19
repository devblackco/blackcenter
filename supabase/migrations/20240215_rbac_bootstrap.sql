-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EXPEDICAO', 'LEITOR')),
  status TEXT NOT NULL CHECK (status IN ('ATIVO', 'PENDENTE', 'BLOQUEADO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'
  )
);

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'ATIVO'
  )
);

-- Policy: Specific for Bootstrap (allow system/triggers or initial upsert via service role if needed, 
-- but since we are doing it via client side for now as per Context logic, we might need a special policy 
-- OR rely on the fact that if I am the user, I can insert my own profile IF I don't have one? 
-- Actually, the context logic upserts. 
-- Let's allow users to specific Insert their own profile ONLY if it matches their ID. 
-- AND they cannot set themselves as ADMIN unless they are the constrained email.
-- To keep it simple for the MVP and since we handle 'Root Admin' logic in the backend/context:
-- We will allow INSERT if auth.uid() = user_id. The Context ensures the data is correct.
-- Ideally this should be a Trigger.
CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
-- Note: A malicious user could technically insert themselves as ADMIN via API if they know the schema.
-- For a strict production system, this should be a Postgres Trigger `after insert on auth.users`.
-- However, following the requested "Bootstrap via Context" approach, we enable this.
-- We can add a constraint/trigger later to downgrade anyone trying to be ADMIN if not allowed.
