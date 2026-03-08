import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const isCustomDomain = () =>
  !window.location.hostname.includes("lovable.app") &&
  !window.location.hostname.includes("lovableproject.com") &&
  window.location.hostname !== "localhost";

export const signInWithGoogle = async (redirectPath = "/") => {
  if (isCustomDomain()) {
    // Custom domains: use Supabase OAuth directly (requires own Google credentials configured)
    // The auth-bridge /~oauth route doesn't exist on custom domains, causing 404
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };

    if (data?.url) {
      window.location.href = data.url;
    }

    return { error: null };
  }

  // Lovable preview domains: use auth-bridge (managed credentials)
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}${redirectPath}`,
  });
  return { error: error ?? null };
};
