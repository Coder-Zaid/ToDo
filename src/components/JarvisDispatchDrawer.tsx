"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Zap, X } from "lucide-react";
import { soundEngine } from "@/lib/sounds";

interface JarvisDispatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    _id?: any;
    title: string;
    role?: string;
    suggestedPrompt?: string;
  } | null;
  onExecuted: () => void;
}

export function JarvisDispatchDrawer({
  isOpen,
  onClose,
  task,
  onExecuted,
}: JarvisDispatchDrawerProps) {
  const dispatchMutation = useMutation(api.tasks.dispatchJob);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setPrompt(
        task.suggestedPrompt ||
          `Implement and verify: ${task.title}. Follow strict TypeScript conventions and verify zero build errors.`
      );
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleExecute = async () => {
    setIsSubmitting(true);
    if (soundEngine) soundEngine.pop();
    try {
      await dispatchMutation({
        taskId: task._id,
        role: task.role || "neuvera",
        title: task.title,
        prompt,
      });
      onClose();
      onExecuted();
    } catch (err) {
      console.error("Failed to dispatch job", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`drawer-right fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#090909] border-l border-[#1F1F1F] z-50 p-6 flex flex-col justify-between shadow-2xl ${
        isOpen ? "open" : ""
      }`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white text-black">
              <Zap size={11} className="fill-black stroke-black" />
            </div>
            <span className="font-mono text-xs font-semibold text-white tracking-wider">
              JARVIS DISPATCH
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-white cursor-pointer p-1 text-base transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected Task Summary */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#111111] border border-[#1E1E1E]">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#666666]">
            <span>TARGET TASK</span>
            <span className="text-white font-medium uppercase">{task.role || "NEUVERA"}</span>
          </div>
          <span className="text-sm font-semibold text-[#EAEAEA] leading-snug">
            {task.title}
          </span>
        </div>

        {/* Prompt / Directive Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">
              Prompt / Agent Directive
            </span>
            <span className="text-[10px] font-mono text-[#555555]">Autonomous Coding Agent</span>
          </div>
          <textarea
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] focus:border-white rounded-xl p-3 text-xs text-[#EAEAEA] font-mono leading-relaxed focus:outline-none resize-none transition-colors"
          />
        </div>

        {/* Parameters */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#161616]">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#777777]">Environment Sandbox</span>
            <span className="text-[#CCCCCC]">Local Workspace</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#777777]">Strict Typecheck & Build</span>
            <span className="text-white">Enabled (0 errors)</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-[#1A1A1A]">
        <button
          onClick={handleExecute}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#D5D5D5] transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-mono"
        >
          <Zap size={11} className="fill-black stroke-black" />
          <span>{isSubmitting ? "Dispatching..." : "Execute with Jarvis"}</span>
        </button>
        <button
          onClick={onClose}
          className="py-2.5 px-4 rounded-xl bg-[#141414] border border-[#262626] text-[#888888] hover:text-white transition-colors text-xs cursor-pointer font-mono"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
