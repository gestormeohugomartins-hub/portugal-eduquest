INSERT INTO public.students (user_id, parent_id, display_name, nickname, school_year, district, gender)
VALUES ('8847205b-657e-4d7f-9d89-b7128548aa80', 'dc2dc3ad-0aa9-4e9b-9846-52b49880feb3', 'Gabriel Martins', 'Gabriel', '4', 'porto', 'indefinido');

UPDATE public.authorized_emails SET used = true WHERE email = 'hugolyso@gmail.com';