"use client";

import { useEffect, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bell, BellOff, BellRing, Loader2, Send } from "lucide-react";
import {
  registerServiceWorker,
  getExistingSubscription,
  subscribeDeviceToPush,
} from "@/lib/notifications";

export function NotificationToggle() {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isIosBrowser, setIsIosBrowser] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const saveSubscription = useMutation(api.subscriptions.save);
  const removeSubscription = useMutation(api.subscriptions.remove);
  const sendTestNotification = useAction(api.notifications.sendTestNotification);

  const vapidPublicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BFEhzWbuokU9sGjvvwXvJFlCd8PrQxHezlb1W1KgbGlRi_kWjX7cVcAM7WCaRc5Vxs-18Bt5wCZ8lPq5zwiHdqA";

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if on iOS Safari (not in standalone PWA mode)
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in navigator && Boolean((navigator as unknown as { standalone: boolean }).standalone));
    if (isIos && !isStandalone) {
      setIsIosBrowser(true);
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setIsSupported(false);
      return;
    }

    registerServiceWorker().then(async () => {
      const sub = await getExistingSubscription();
      if (sub && Notification.permission === "granted") {
        setIsSubscribed(true);
      }
    });
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      setStatusMessage("Notifications are not supported in this browser.");
      return;
    }

    if (isIosBrowser) {
      setStatusMessage("On iPhone: Tap Share → 'Add to Home Screen' to enable notifications.");
      return;
    }

    if (!vapidPublicKey) {
      setStatusMessage("VAPID public key not configured.");
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const sub = await getExistingSubscription();
        if (sub) {
          await sub.unsubscribe();
          await removeSubscription({ endpoint: sub.endpoint });
        }
        setIsSubscribed(false);
        setStatusMessage("Notifications turned off.");
      } else {
        // Subscribe
        const sub = await subscribeDeviceToPush(vapidPublicKey);
        if (sub) {
          const rawKey = sub.getKey ? sub.getKey("p256dh") : null;
          const rawAuth = sub.getKey ? sub.getKey("auth") : null;

          const p256dh = rawKey
            ? btoa(String.fromCharCode(...new Uint8Array(rawKey)))
            : "";
          const auth = rawAuth
            ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
            : "";

          await saveSubscription({
            endpoint: sub.endpoint,
            keys: { p256dh, auth },
          });

          setIsSubscribed(true);
          setStatusMessage("Notifications enabled! You will receive milestone reminders.");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setStatusMessage(error.message || "Failed to enable notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      const sub = await getExistingSubscription();
      if (!sub) {
        setStatusMessage("Please enable notifications first.");
        return;
      }

      const rawKey = sub.getKey ? sub.getKey("p256dh") : null;
      const rawAuth = sub.getKey ? sub.getKey("auth") : null;

      const p256dh = rawKey
        ? btoa(String.fromCharCode(...new Uint8Array(rawKey)))
        : "";
      const auth = rawAuth
        ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
        : "";

      const res = await sendTestNotification({
        endpoint: sub.endpoint,
        p256dh,
        auth,
      });

      if (res.success) {
        setStatusMessage("Test notification sent! Check your device lock screen.");
      } else {
        setStatusMessage(`Error: ${res.error || "Failed to send"}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage(error.message || "Failed to send test push.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-1.5 rounded transition-all flex items-center gap-1.5 ${
          isSubscribed
            ? "text-white hover:text-white/80"
            : "text-[#4A4A4A] hover:text-[#7A7A7A]"
        }`}
        title={isSubscribed ? "Push Notifications Active" : "Enable Push Notifications"}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-white" />
        ) : isSubscribed ? (
          <div className="relative">
            <BellRing size={16} className="text-[#EAEAEA]" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
        ) : (
          <Bell size={16} />
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-8 z-50 w-72 p-3 bg-[#111111] border border-[#222222] rounded-lg shadow-2xl flex flex-col gap-2.5 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
            <span className="font-medium text-[#EAEAEA]">Push Notifications</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                isSubscribed ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-neutral-900 text-neutral-400"
              }`}
            >
              {isSubscribed ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <p className="text-[#888888] leading-relaxed text-[11px]">
            Alerts you at 33%, 50%, 70% timeline milestones, 24h before deadline, and at due time.
          </p>

          {isIosBrowser && (
            <div className="p-2 bg-neutral-900/80 border border-neutral-800 rounded text-[11px] text-[#A0A0A0] leading-snug">
              📱 <strong className="text-white">iPhone users:</strong> Tap Safari&apos;s Share button (box with up arrow) and select <strong className="text-white">&quot;Add to Home Screen&quot;</strong> to receive notifications.
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`flex-1 py-1.5 px-2.5 rounded font-medium flex items-center justify-center gap-1.5 transition-colors ${
                isSubscribed
                  ? "bg-[#1A1A1A] hover:bg-[#252525] text-red-400 border border-red-950"
                  : "bg-white text-black hover:bg-neutral-200"
              }`}
            >
              {isLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isSubscribed ? (
                <>
                  <BellOff size={13} />
                  <span>Disable</span>
                </>
              ) : (
                <>
                  <Bell size={13} />
                  <span>Enable on Phone</span>
                </>
              )}
            </button>

            {isSubscribed && (
              <button
                onClick={handleTestNotification}
                disabled={isTesting}
                className="py-1.5 px-2.5 bg-[#1A1A1A] hover:bg-[#252525] text-[#EAEAEA] border border-[#333333] rounded flex items-center gap-1 transition-colors"
                title="Send test push to phone"
              >
                {isTesting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Send size={12} />
                    <span>Test</span>
                  </>
                )}
              </button>
            )}
          </div>

          {statusMessage && (
            <div className="p-2 bg-black/60 rounded text-[11px] text-[#C0C0C0] border border-[#222222]">
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
