"use client";

import React, { useRef } from "react";
import { Zap, X, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JarvisCornerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Array<{
    _id: any;
    title: string;
    role?: string;
    completed: boolean;
    deadline?: number | null;
    isAgentActionable?: boolean;
  }>;
  onSelectTaskToDispatch: (task: any) => void;
}

// Tasks that can be autonomously executed by AI/code agents
function isTaskAIActionable(t: { title: string; isAgentActionable?: boolean }) {
  if (t.isAgentActionable !== undefined) return t.isAgentActionable;
  const lower = t.title.toLowerCase();
  // Filter out human meetings and legal paperwork
  if (
    lower.includes("paperwork") ||
    lower.includes("entity type") ||
    lower.includes("dpiit") ||
    lower.includes("meeting") ||
    lower.includes("outreach") ||
    lower.includes("pitch to") ||
    lower.includes("meet with")
  ) {
    return false;
  }
  // Engineering, test, model, build, synthesize, audit
  return (
    lower.includes("build") ||
    lower.includes("test") ||
    lower.includes("model") ||
    lower.includes("pipeline") ||
    lower.includes("visualizer") ||
    lower.includes("synthesize") ||
    lower.includes("benchmark") ||
    lower.includes("train") ||
    lower.includes("audit") ||
    lower.includes("integrate") ||
    lower.includes("bridge") ||
    lower.includes("schema")
  );
}

export function JarvisCornerDrawer({
  isOpen,
  onClose,
  tasks,
  onSelectTaskToDispatch,
}: JarvisCornerDrawerProps) {
  const actionableTasks = tasks.filter(
    (t) => !t.completed && isTaskAIActionable(t)
  );
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 40) {
      onClose();
    }
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`drawer-right fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#090909] border-l border-[#1F1F1F] z-50 p-6 flex flex-col justify-between shadow-2xl ${
        isOpen ? "open" : ""
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-white text-black">
              <Zap size={12} className="fill-black stroke-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-semibold text-white tracking-wider">
                JARVIS CORNER
              </span>
              <span className="font-mono text-[9px] text-[#666666]">
                AI ACTIONABLE PIPELINE • ALL PROFILES
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-white cursor-pointer p-1 text-base transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Feed Header */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#555555] px-1">
          <span>{actionableTasks.length} DETECTED PIPELINE TASKS</span>
          <span>SCROLLABLE &darr;</span>
        </div>

        {/* Vertical Scrollable Feed of Tasks */}
        <div className="overflow-y-auto max-h-[66vh] flex flex-col gap-2.5 pr-1 scrollbar-none">
          {actionableTasks.map((t) => (
            <div
              key={t._id}
              className="p-3.5 rounded-xl bg-[#101010] border border-[#1E1E1E] hover:border-[#333333] transition-colors flex flex-col gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1B1B1B] text-[#CCCCCC] border border-[#2A2A2A] uppercase">
                  {t.role || "General"}
                </span>
                {t.deadline && (
                  <span className="text-[10px] font-mono text-[#666666]">
                    in {formatDistanceToNow(t.deadline)}
                  </span>
                )}
              </div>

              <span className="text-xs font-medium text-[#EAEAEA] leading-snug">
                {t.title}
              </span>

              <div className="flex items-center justify-between pt-1 border-t border-[#181818]">
                <span className="text-[10px] font-mono text-[#777777]">
                  Autonomous Agent
                </span>
                <button
                  onClick={() => onSelectTaskToDispatch(t)}
                  className="flex items-center gap-1 text-[10px] font-mono text-white hover:underline cursor-pointer"
                >
                  <span>Give to Jarvis</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}

          {actionableTasks.length === 0 && (
            <div className="py-12 text-center text-[#555555] font-mono text-xs">
              No pending AI tasks found across roadmaps.
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#666666]">
        <span>Swipe right or &times; to exit</span>
        <span
          onClick={onClose}
          className="text-white hover:underline cursor-pointer"
        >
          Done
        </span>
      </div>
    </div>
  );
}
