"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Mail, Check, X } from "lucide-react";
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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages && messages.length === 0) {
      seedMutation().catch(() => {});
    }
  }, [messages, seedMutation]);

  useEffect(() => {
    setSelectedRole(defaultRole);
  }, [defaultRole]);

  if (!isOpen) return null;

  const currentMsg = messages && messages.length > 0 ? messages[currentIndex] : null;

  const handleAccept = async () => {
    if (!currentMsg) return;
    if (soundEngine) soundEngine.pop();
    await acceptMutation({
      messageId: currentMsg._id,
      title: currentMsg.extractedTask,
      role: selectedRole,
    });
    if (messages && currentIndex >= messages.length - 1) {
      onClose();
    }
  };

  const handleDecline = async () => {
    if (!currentMsg) return;
    if (soundEngine) soundEngine.click();
    await declineMutation({ messageId: currentMsg._id });
    if (messages && currentIndex >= messages.length - 1) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#090909] border border-[#222222] rounded-2xl p-6 flex flex-col gap-5 shadow-2xl animate-panel-in">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white text-black">
              <Mail size={12} className="stroke-[2.5px]" />
            </div>
            <span className="font-mono text-xs font-semibold text-white tracking-wider">
              MESSAGE INBOX SCAN
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-white cursor-pointer p-1 text-base transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {currentMsg ? (
          <>
            {/* Scanned Message Card */}
            <div className="p-3.5 rounded-xl bg-[#111111] border border-[#1E1E1E] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#888888]">{currentMsg.sender}</span>
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

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#1A1A1A]">
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#D5D5D5] transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-mono"
              >
                <Check size={14} className="stroke-[3px]" />
                <span>Accept Task</span>
              </button>
              <button
                onClick={handleDecline}
                className="py-2.5 px-4 rounded-xl bg-[#141414] border border-[#262626] text-[#888888] hover:text-[#E00] transition-colors text-xs cursor-pointer font-mono"
              >
                Decline
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center flex flex-col items-center gap-2 text-[#555555] font-mono text-xs">
            <span>&check; No pending messages</span>
            <span className="text-[10px] text-[#444444]">All message triage tasks up to date</span>
          </div>
        )}
      </div>
    </div>
  );
}
