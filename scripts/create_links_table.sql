-- Create links table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    -- Drop policies if they exist to avoid errors
    DROP POLICY IF EXISTS "Anyone can read links" ON public.links;
    DROP POLICY IF EXISTS "Users can create links" ON public.links;
    DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
    DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;
    
    -- Create policies
    CREATE POLICY "Anyone can read links" 
    ON public.links FOR SELECT 
    TO PUBLIC;
    
    CREATE POLICY "Users can create links" 
    ON public.links FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own links" 
    ON public.links FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own links" 
    ON public.links FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Create trigger for updated_at if the set_updated_at function exists
DROP TRIGGER IF EXISTS set_links_updated_at ON public.links;
CREATE TRIGGER set_links_updated_at
    BEFORE UPDATE ON public.links
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Create the get_top_tags function for resources
CREATE OR REPLACE FUNCTION public.get_top_tags(limit_count integer DEFAULT 10)
RETURNS TABLE (tag text, count bigint) AS $$
BEGIN
  -- Check if resources table exists first to avoid errors
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'resources'
  ) THEN
    RETURN QUERY
    SELECT t.tag, COUNT(*)::bigint
    FROM public.resources r, unnest(r.tags) t(tag)
    GROUP BY t.tag
    ORDER BY COUNT(*) DESC
    LIMIT limit_count;
  ELSE
    -- Return empty result if table doesn't exist
    RETURN QUERY SELECT NULL::text, 0::bigint WHERE FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 