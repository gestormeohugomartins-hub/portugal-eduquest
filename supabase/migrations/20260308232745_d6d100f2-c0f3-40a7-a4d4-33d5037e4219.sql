
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  child_emails jsonb;
  child_record jsonb;
  _student_data jsonb;
  _new_student_id uuid;
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

  -- If student registration, create student record from metadata
  _student_data := NEW.raw_user_meta_data->'student_data';
  IF _student_data IS NOT NULL AND (NEW.raw_user_meta_data->>'role') = 'student' THEN
    INSERT INTO public.students (
      user_id, parent_id, display_name, nickname, school_year, district, gender, school_id,
      coins, diamonds
    ) VALUES (
      NEW.id,
      (_student_data->>'parent_id')::uuid,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      COALESCE(_student_data->>'nickname', split_part(NEW.email, '@', 1)),
      COALESCE((_student_data->>'school_year')::school_year, '1'),
      NULLIF(_student_data->>'district', '')::district,
      COALESCE(_student_data->>'gender', 'indefinido'),
      NULLIF(_student_data->>'school_id', '')::uuid,
      500,
      10
    )
    RETURNING id INTO _new_student_id;

    -- Grant starting natural resources (15 of each)
    INSERT INTO public.player_resources (student_id, resource_type, amount)
    VALUES
      (_new_student_id, 'wood', 15),
      (_new_student_id, 'stone', 15),
      (_new_student_id, 'iron', 15),
      (_new_student_id, 'coal', 15),
      (_new_student_id, 'food', 15),
      (_new_student_id, 'leather', 15),
      (_new_student_id, 'fish', 15);

    -- Mark the authorized email as used
    UPDATE public.authorized_emails 
    SET used = true 
    WHERE id = (_student_data->>'authorized_email_id')::uuid;
  END IF;

  RETURN NEW;
END;
$function$;
