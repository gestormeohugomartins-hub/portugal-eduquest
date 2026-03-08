import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Call the database function that creates in-app reminders
    const { error } = await supabase.rpc("create_daily_quiz_reminders");

    if (error) {
      console.error("Error creating reminders:", error);
    }

    // Also send native push notifications to all students with reminders enabled
    const { data: students } = await supabase
      .from("students")
      .select("id, display_name, quiz_reminders_enabled")
      .eq("quiz_reminders_enabled", true);

    let pushCount = 0;
    if (students) {
      for (const student of students) {
        // Check if student has done a quiz today
        const today = new Date().toISOString().split("T")[0];
        const { count } = await supabase
          .from("quiz_history")
          .select("*", { count: "exact", head: true })
          .eq("student_id", student.id)
          .gte("answered_at", today);

        if ((count || 0) === 0) {
          // Send push notification via the send-push-notification function
          await supabase.functions.invoke("send-push-notification", {
            body: {
              student_id: student.id,
              title: "📚 Hora do Quiz!",
              body: `Olá ${student.display_name}! Ainda não fizeste nenhum quiz hoje. Responde para ganhar moedas e XP!`,
              data: { action: "quiz", type: "quiz_reminder", icon: "📚" },
            },
          });
          pushCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Daily reminders created. Push sent to ${pushCount} students.` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
