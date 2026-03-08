import { useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Registers the device for native push notifications (iOS/Android)
 * and stores the FCM/APNs token in the push_subscriptions table.
 * Falls back gracefully on web (no-op).
 */
export const usePushNotifications = (studentId: string | undefined) => {
  const registerToken = useCallback(async (token: string) => {
    if (!studentId) return;

    // Upsert the native push token (reuse push_subscriptions table)
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          student_id: studentId,
          endpoint: token,
          p256dh: "native",
          auth: "native",
        } as any,
        { onConflict: "student_id,endpoint" as any }
      );

    if (error) {
      console.error("Failed to save push token:", error);
    } else {
      console.log("Push token registered successfully");
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    if (!Capacitor.isNativePlatform()) return; // Only on native apps

    const setup = async () => {
      try {
        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") {
          console.log("Push notification permission not granted");
          return;
        }

        // Register with APNs / FCM
        await PushNotifications.register();

        // Listen for registration success
        PushNotifications.addListener("registration", (token) => {
          console.log("Push registration token:", token.value);
          registerToken(token.value);
        });

        // Listen for registration errors
        PushNotifications.addListener("registrationError", (err) => {
          console.error("Push registration error:", err.error);
        });

        // Listen for incoming notifications (foreground)
        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          toast(notification.title || "Notificação", {
            description: notification.body || "",
            duration: 5000,
          });
        });

        // Listen for notification taps (background → opened)
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data = action.notification.data;
          if (data?.action === "quiz") {
            // Navigate to quiz - handled via window event
            window.dispatchEvent(new CustomEvent("push-action", { detail: { action: "quiz" } }));
          } else if (data?.action === "battle") {
            window.dispatchEvent(new CustomEvent("push-action", { detail: { action: "battle" } }));
          }
        });
      } catch (err) {
        console.error("Push notification setup failed:", err);
      }
    };

    setup();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [studentId, registerToken]);
};
