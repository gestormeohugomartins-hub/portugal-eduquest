import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { student_id, title, body, data } = await req.json();

    if (!student_id || !title) {
      return new Response(
        JSON.stringify({ error: "student_id and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all push tokens for this student
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, auth")
      .eq("student_id", student_id);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const sub of subscriptions) {
      // Native push via FCM
      if (sub.auth === "native" && fcmServerKey) {
        try {
          const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `key=${fcmServerKey}`,
            },
            body: JSON.stringify({
              to: sub.endpoint,
              notification: {
                title,
                body: body || "",
                icon: "/pwa-192.png",
                click_action: "FLUTTER_NOTIFICATION_CLICK",
              },
              data: data || {},
            }),
          });
          const fcmResult = await fcmResponse.json();
          results.push({ type: "fcm", success: fcmResult.success === 1, token: sub.endpoint.slice(0, 20) });
        } catch (err) {
          console.error("FCM send error:", err);
          results.push({ type: "fcm", success: false, error: String(err) });
        }
      }
      // Web push subscriptions (existing p256dh-based)
      else if (sub.auth !== "native") {
        // Web push handled by existing send-email or browser service worker
        results.push({ type: "web", skipped: true });
      }
    }

    // Also create an in-app notification
    await supabase.from("notifications").insert({
      student_id,
      title,
      message: body || "",
      icon: data?.icon || "🔔",
      type: data?.type || "push",
    });

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
