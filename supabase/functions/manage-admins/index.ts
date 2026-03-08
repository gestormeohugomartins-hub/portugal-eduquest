import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    // Verify the calling user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, email, role } = await req.json();

    // Check if any admin roles exist at all (using service role key - bypasses RLS)
    const { data: existingRoles } = await supabase
      .from("user_roles")
      .select("*");

    const isFirstAdmin = !existingRoles || existingRoles.length === 0;

    // Bootstrap: allow if no admins exist
    if (action === "bootstrap") {
      if (!isFirstAdmin) {
        return new Response(JSON.stringify({ error: "Admins already exist. Bootstrap not allowed." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "super_admin" });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Bootstrapped as super_admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check-role: anyone can ask if they're admin (returns boolean)
    if (action === "check") {
      const isAdmin = existingRoles?.some((r: any) => r.user_id === user.id) || false;
      const noAdmins = isFirstAdmin;
      return new Response(JSON.stringify({ isAdmin, noAdmins }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require admin/super_admin
    const callerIsAdmin = existingRoles?.some((r: any) => r.user_id === user.id);
    const callerIsSuperAdmin = existingRoles?.some((r: any) => r.user_id === user.id && r.role === "super_admin");

    if (!callerIsAdmin) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List: any admin can list
    if (action === "list") {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const rolesWithEmail = (existingRoles || []).map((r: any) => {
        const u = users.find((u: any) => u.id === r.user_id);
        return { ...r, email: u?.email || "unknown" };
      });

      return new Response(JSON.stringify({ roles: rolesWithEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add/remove require super_admin
    if (!callerIsSuperAdmin) {
      return new Response(JSON.stringify({ error: "Only super_admins can manage admin roles" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "add") {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const targetUser = users.find((u: any) => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "User not found. They must register first." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: targetUser.id, role: role || "admin" });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove") {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const targetUser = users.find((u: any) => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (targetUser.id === user.id) {
        return new Response(JSON.stringify({ error: "Cannot remove your own admin role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUser.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
