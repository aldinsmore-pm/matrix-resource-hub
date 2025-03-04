-- Create resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    image_url TEXT,
    category TEXT,
    tags TEXT[],
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    -- Drop policies if they exist to avoid errors
    DROP POLICY IF EXISTS "Anyone can read resources" ON public.resources;
    DROP POLICY IF EXISTS "Users can create resources" ON public.resources;
    DROP POLICY IF EXISTS "Users can update their own resources" ON public.resources;
    DROP POLICY IF EXISTS "Users can delete their own resources" ON public.resources;
    
    -- Create policies
    CREATE POLICY "Anyone can read resources" 
    ON public.resources FOR SELECT 
    TO PUBLIC;
    
    CREATE POLICY "Users can create resources" 
    ON public.resources FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own resources" 
    ON public.resources FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own resources" 
    ON public.resources FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_resources_updated_at ON public.resources;
CREATE TRIGGER set_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at(); 