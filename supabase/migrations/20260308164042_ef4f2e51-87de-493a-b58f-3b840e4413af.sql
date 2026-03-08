
-- Add nickname column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nickname text;

-- Update handle_new_user trigger to also insert authorized_emails from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  child_emails jsonb;
  child_record jsonb;
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'parent')
  );

  -- If parent registration includes child emails, insert them into authorized_emails
  child_emails := NEW.raw_user_meta_data->'child_emails';
  IF child_emails IS NOT NULL AND jsonb_array_length(child_emails) > 0 THEN
    FOR child_record IN SELECT * FROM jsonb_array_elements(child_emails)
    LOOP
      INSERT INTO public.authorized_emails (parent_id, email, school_year)
      VALUES (
        NEW.id,
        lower(trim(child_record->>'email')),
        COALESCE((child_record->>'schoolYear')::school_year, '1')
      );
    END LOOP;
  END IF;

  -- If parent registration includes district, update profile
  IF NEW.raw_user_meta_data->>'district' IS NOT NULL AND NEW.raw_user_meta_data->>'district' != '' THEN
    UPDATE public.profiles 
    SET district = (NEW.raw_user_meta_data->>'district')::district
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;
