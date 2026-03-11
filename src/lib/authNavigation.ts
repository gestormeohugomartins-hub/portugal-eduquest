import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "parent" | "student";

const parseRole = (value: unknown): AppRole | null => {
  if (value === "parent" || value === "student") return value;
  return null;
};

export const resolvePostLoginRoute = async (user: User): Promise<string> => {
  let role = parseRole(user.user_metadata?.role);

  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    role = parseRole(profile?.role);
  }

  if (role === "parent") return "/parent";

  const { data: student } = await supabase
    .from("students")
    .select("xp")
    .eq("user_id", user.id)
    .maybeSingle();

  if (student?.xp === 0) return "/placement-test";

  return "/game";
};
