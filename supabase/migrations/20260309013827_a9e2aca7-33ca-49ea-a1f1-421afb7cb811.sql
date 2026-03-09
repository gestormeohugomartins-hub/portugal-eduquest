-- Add locality column to schools table
ALTER TABLE public.schools 
ADD COLUMN locality text;

-- Add index for better performance on locality searches
CREATE INDEX idx_schools_locality ON public.schools(locality);

COMMENT ON COLUMN public.schools.locality IS 'Localidade (cidade/freguesia) where the school is located';