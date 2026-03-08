import { lovable } from "@/integrations/lovable/index";

export const signInWithGoogle = async (redirectPath = "/") => {
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}${redirectPath}`,
  });
  return { error: error ?? null };
};
