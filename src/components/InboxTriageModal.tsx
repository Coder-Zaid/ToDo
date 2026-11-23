"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
import { Mail, Check, X, Loader2, RotateCw } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { soundEngine } from "@/lib/sounds";

interface InboxTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: string;
}

export function InboxTriageModal({ isOpen, onClose, defaultRole }: InboxTriageModalProps) {
  const messages = useQuery(api.tasks.listInboxMessages);
  const acceptMutation = useMutation(api.tasks.acceptInboxMessage);
  const declineMutation = useMutation(api.tasks.declineInboxMessage);
  const seedMutation = useMutation(api.tasks.seedDefaultInboxAndJobs);

  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  // Trigger active WhatsApp scan
  const triggerScan = useCallback(async () => {
    setIsScanning(true);
    setScanStatus("Scanning WhatsApp...");
    try {
      const res = await fetch("/api/scan-messages", { method: "POST" });
      const data = await res.json();
      if (data.newTasksAdded > 0) {
        setScanStatus(`Found ${data.newTasksAdded} new task${data.newTasksAdded > 1 ? "s" : ""}`);
      } else {
        setScanStatus("Inbox up to date");
      }
    } catch (_) {
      setScanStatus("Synced");
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanStatus(null), 3000);
    }
  }, []);

  // Auto-scan on modal open and reset any local session dismissals
  useEffect(() => {
    if (isOpen) {
      setDismissedIds([]);
      triggerScan();
    }
  }, [isOpen, triggerScan]);

  // Filter out any optimistically dismissed items
  const pendingMessages = (messages || []).filter((m) => !dismissedIds.includes(m._id));
  const currentMsg = pendingMessages[0] || null;

  useEffect(() => {
    if (currentMsg?.suggestedRole) {
      setSelectedRole(currentMsg.suggestedRole);
    } else {
      setSelectedRole(defaultRole);
    }
  }, [currentMsg, defaultRole]);

  if (!isOpen) return null;

  const handleAccept = async (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (!currentMsg) return;
    const msg = currentMsg;

    // 1. Optimistic removal: vanish card instantly in 0ms!
    setDismissedIds((prev) => [...prev, msg._id]);
    if (soundEngine) soundEngine.pop();

    // If this was the last item, close the modal immediately
    if (pendingMessages.length <= 1) {
      setTimeout(onClose, 250);
    }

    // 2. Fire mutation in background
    try {
      await acceptMutation({
        messageId: msg._id,
        title: msg.extractedTask,
        role: selectedRole,
      });
    } catch (err) {
      console.error("Failed to accept message:", err);
    }
  };

  const handleDecline = async (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (!currentMsg) return;
    const msgId = currentMsg._id;

    // 1. Optimistic removal: vanish card instantly in 0ms!
    setDismissedIds((prev) => [...prev, msgId]);
    if (soundEngine) soundEngine.click();

    // If this was the last item, close the modal immediately
    if (pendingMessages.length <= 1) {
      setTimeout(onClose, 250);
    }

    // 2. Fire mutation in background
    try {
      await declineMutation({ messageId: msgId });
    } catch (err) {
      console.error("Failed to decline message:", err);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/85 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#090909] border border-[#222222] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 shadow-2xl animate-panel-in my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white text-black">
              <Mail size={12} className="stroke-[2.5px]" />
            </div>
            <span className="font-mono text-xs font-semibold text-white tracking-wider">
              MESSAGE INBOX SCAN
            </span>
            {pendingMessages.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1A1A] text-[#888888] border border-[#262626]">
                {pendingMessages.length} pending
              </span>
            )}
            {scanStatus && (
              <span className="text-[9px] font-mono text-[#00E5FF] animate-pulse">
                • {scanStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={triggerScan}
              disabled={isScanning}
              title="Rescan WhatsApp now"
              className="text-[#666666] hover:text-white cursor-pointer p-1.5 text-base transition-colors touch-manipulation disabled:opacity-40"
            >
              <RotateCw size={13} className={isScanning ? "animate-spin text-[#00E5FF]" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#666666] hover:text-white cursor-pointer p-1.5 text-base transition-colors touch-manipulation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {currentMsg ? (
          <>
            {/* Scanned Message Card */}
            <div className="p-3.5 rounded-xl bg-[#111111] border border-[#1E1E1E] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#AAAAAA] font-medium">{currentMsg.sender}</span>
                <span className="text-[#555555]">
                  {new Date(currentMsg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-[#EAEAEA] italic leading-relaxed">
                &ldquo;{currentMsg.text}&rdquo;
              </p>
            </div>

            {/* Extracted Task Proposal */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#0D0D0D] border border-[#262626]">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#777777]">
                <span>EXTRACTED TASK CANDIDATE</span>
                <span className="text-white uppercase">{currentMsg.suggestedRole}</span>
              </div>
              <span className="text-sm font-semibold text-white leading-snug">
                {currentMsg.extractedTask}
              </span>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#888888] pt-2 border-t border-[#181818]">
                <span>Assign to Profile:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-[#161616] border border-[#2E2E2E] text-white text-xs px-2.5 py-1 rounded focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions: Big, full-width touch-friendly buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#1A1A1A]">
              <button
                type="button"
                onClick={handleDecline}
                className="flex-1 py-3 px-4 min-h-[48px] rounded-xl bg-[#161616] border border-[#2A2A2A] active:bg-[#252525] text-[#CCCCCC] hover:text-[#FF4444] hover:border-[#662222] transition-colors text-xs font-mono font-medium cursor-pointer touch-manipulation flex items-center justify-center gap-2 select-none"
              >
                <X size={14} />
                <span>Decline</span>
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="flex-1 py-3 px-4 min-h-[48px] rounded-xl bg-white text-black font-semibold text-xs active:bg-[#CCCCCC] hover:bg-[#EAEAEA] transition-colors cursor-pointer font-mono touch-manipulation flex items-center justify-center gap-2 select-none"
              >
                <Check size={14} className="stroke-[3px]" />
                <span>Accept Task</span>
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center flex flex-col items-center gap-3 text-[#555555] font-mono text-xs">
            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-white">
              <Check size={14} />
            </div>
            <span className="text-[#CCCCCC] font-medium">&check; All messages triaged</span>
            <span className="text-[10px] text-[#555555]">
              No pending actionable messages from WhatsApp
            </span>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#DDD] transition-colors cursor-pointer min-h-[40px] touch-manipulation"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissedIds([]);
                  seedMutation();
                }}
                className="text-[10px] text-[#555555] hover:text-[#888888] underline cursor-pointer p-2 touch-manipulation"
              >
                Reset demo messages
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
