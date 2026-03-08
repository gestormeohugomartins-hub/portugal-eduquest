import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const signInWithGoogle = async (redirectPath = "/") => {
  const isCustomDomain =
    !window.location.hostname.includes("lovable.app") &&
    !window.location.hostname.includes("lovableproject.com") &&
    !window.location.hostname.includes("localhost");

  if (isCustomDomain) {
    // On custom domain (e.g. Vercel), bypass Lovable auth-bridge
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };

    if (data?.url) {
      const oauthUrl = new URL(data.url);
      const allowedHosts = ["accounts.google.com"];
      if (!allowedHosts.some((host) => oauthUrl.hostname === host)) {
        return { error: new Error("Invalid OAuth redirect URL") };
      }
      window.location.href = data.url;
    }

    return { error: null };
  } else {
    // On Lovable domains, use managed auth-bridge
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    return { error: error ?? null };
  }
};
