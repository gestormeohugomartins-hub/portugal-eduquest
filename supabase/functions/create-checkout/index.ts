import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { studentId, associationCode, promoCode } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const metadata: Record<string, string> = { student_id: studentId };
    if (associationCode) {
      metadata.association_code = associationCode;
    }

    // If promo code, create a Stripe coupon on-the-fly
    const discounts: any[] = [];
    if (promoCode) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode)
        .eq("is_active", true)
        .single();

      if (promo) {
        const couponParams: any = { duration: "once" };
        if (promo.discount_percent > 0) couponParams.percent_off = promo.discount_percent;
        else if (promo.discount_amount > 0) { couponParams.amount_off = Math.round(promo.discount_amount * 100); couponParams.currency = "eur"; }
        const coupon = await stripe.coupons.create(couponParams);
        discounts.push({ coupon: coupon.id });
        metadata.promo_code = promoCode;
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1T8gBJRwhbKQXE0Jo3VJxe8t",
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata,
      ...(discounts.length > 0 ? { discounts } : {}),
      success_url: `${req.headers.get("origin")}/game?premium=success`,
      cancel_url: `${req.headers.get("origin")}/parent?premium=canceled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
