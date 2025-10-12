-- Add latitude and longitude fields to organizations table for precise location tracking

-- Add coordinate fields
ALTER TABLE public.organizations 
ADD COLUMN lat DOUBLE PRECISION,
ADD COLUMN lng DOUBLE PRECISION;

-- Add check constraints to ensure coordinates are within reasonable bounds
-- Japan's approximate bounds: lat 24-46, lng 123-146
ALTER TABLE public.organizations 
ADD CONSTRAINT check_latitude_range CHECK (lat IS NULL OR (lat >= 20 AND lat <= 50)),
ADD CONSTRAINT check_longitude_range CHECK (lng IS NULL OR (lng >= 120 AND lng <= 150));

-- Create indexes for geo queries
CREATE INDEX IF NOT EXISTS idx_organizations_coordinates ON public.organizations(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.lat IS 'Latitude coordinate for precise location (Japan: 24-46)';
COMMENT ON COLUMN public.organizations.lng IS 'Longitude coordinate for precise location (Japan: 123-146)';