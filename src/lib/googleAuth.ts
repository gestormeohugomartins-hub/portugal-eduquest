import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const isCustomDomain = () =>
  !window.location.hostname.includes("lovable.app") &&
  !window.location.hostname.includes("lovableproject.com") &&
  window.location.hostname !== "localhost";

export const signInWithGoogle = async (redirectPath = "/") => {
  if (isCustomDomain()) {
    // Bypass auth-bridge on custom domains — it redirects to preview URLs causing 404
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };

    if (data?.url) {
      // The URL points to Supabase auth which then redirects to Google
      window.location.href = data.url;
    }

    return { error: null };
  }

  // Lovable preview domains — use auth-bridge normally
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}${redirectPath}`,
  });
  return { error: error ?? null };
};
