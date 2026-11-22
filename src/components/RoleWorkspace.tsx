"use client";

import React, { useState } from "react";
import { RoleDefinition } from "@/lib/roles";
import { AddTask } from "@/components/AddTask";
import { soundEngine } from "@/lib/sounds";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

interface RoleTask {
  _id: string;
  title: string;
  completed: boolean;
  deadline?: number | null;
  role?: string;
  stepIndex?: number;
  createdAt: number;
}

interface RoleWorkspaceProps {
  role: RoleDefinition;
  tasks: RoleTask[];
  onOpenSidebar: () => void;
}

export function RoleWorkspace({ role, tasks, onOpenSidebar }: RoleWorkspaceProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggle = useMutation(api.tasks.toggle as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seedMilestones = useMutation(api.tasks.seedRoleMilestones as any);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filter tasks belonging to this role
  const roleTasks = tasks
    .filter((t) => t.role === role.id)
    .sort((a, b) => {
      if (a.stepIndex !== undefined && b.stepIndex !== undefined) {
        return a.stepIndex - b.stepIndex;
      }
      return a.createdAt - b.createdAt;
    });

  const uncompletedTasks = roleTasks.filter((t) => !t.completed);
  const activeStep = uncompletedTasks[0]; // Step 1 strictly in focus
  const queuedTasks = uncompletedTasks.slice(1); // Future pending steps
  const completedTasks = roleTasks.filter((t) => t.completed);

  const nextStepIndex = roleTasks.length + 1;

  const handleToggleTask = (taskId: string) => {
    if (soundEngine) soundEngine.tap();
    toggle({ id: taskId });
  };

  return (
    <div className="flex flex-col gap-5 w-full animate-task-in">
      {/* Stealth Header */}
      <header className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight text-[#EAEAEA]">{role.name}</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
              {role.badge}
            </span>
          </div>
          <p className="text-[#7A7A7A] text-[12px] font-mono">{role.tagline}</p>
        </div>

        {/* Secret Sidebar Trigger */}
        <button
          onClick={() => {
            if (soundEngine) soundEngine.slideIn();
            onOpenSidebar();
          }}
          className="text-[#666666] hover:text-[#EAEAEA] text-[11px] font-mono px-2.5 py-1 rounded bg-[#0F0F0F] border border-[#222222] transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Switch Role"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span>[{role.code}]</span>
          <ChevronDown size={12} />
        </button>
      </header>

      {/* SECTION 1: "TO DO" (Strict Step 1 Execution Focus) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#EAEAEA] font-semibold">
              TO DO • CURRENT STEP
            </span>
          </div>
          {activeStep && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/15">
              STEP {activeStep.stepIndex ?? 1} OF {roleTasks.length || 1}
            </span>
          )}
        </div>

        {activeStep ? (
          <div className="bg-[#0A0A0A] border border-[#282828] rounded-xl p-3.5 flex flex-col gap-2.5 transition-all">
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleToggleTask(activeStep._id)}
                className="w-5 h-5 rounded-full border-2 border-white/80 hover:border-white hover:bg-white/10 cursor-pointer flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                title="Complete Step 1"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-[#EAEAEA] leading-snug">
                  {activeStep.title}
                </span>
                <span className="text-[11px] text-[#7A7A7A] leading-tight font-mono">
                  Current active focus • Completing this unlocks Step {(activeStep.stepIndex ?? 1) + 1}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1C1C1C] text-[10px] font-mono text-[#666666]">
              <span>ACTIVE PATH</span>
              <button
                onClick={() => handleToggleTask(activeStep._id)}
                className="text-[#AAAAAA] hover:text-white cursor-pointer transition-colors"
              >
                Mark Done →
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-[#222222] text-center text-xs text-[#555555] font-mono flex flex-col items-center gap-3">
            {roleTasks.length === 0 ? (
              <>
                <p className="text-[#777777]">No milestones planned yet for this role.</p>
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={async () => {
                    setIsSeeding(true);
                    if (soundEngine) soundEngine.magneticSnap();
                    try {
                      await seedMilestones({ role: role.id });
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 text-[#EAEAEA] border border-white/20 text-[11px] font-mono transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{isSeeding ? "Loading Roadmap..." : "Load Curated Roadmap"}</span>
                </button>
              </>
            ) : (
              "All planned steps completed! Add next step below."
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: "TO BE DONE" (Sequenced Roadmap Pipeline) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">
              TO BE DONE • ROADMAP ({queuedTasks.length})
            </span>
          </div>

          {queuedTasks.length > 0 && (
            <button
              onClick={() => {
                if (soundEngine) soundEngine.tap();
                setIsExpanded(!isExpanded);
              }}
              className="text-[10px] font-mono text-[#888888] hover:text-white px-2 py-0.5 rounded bg-[#121212] border border-[#222222] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{isExpanded ? "Collapse" : `View All ${queuedTasks.length} Steps`}</span>
              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>

        {/* Queued Steps: Compact single item when collapsed, full list when expanded */}
        {queuedTasks.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {(isExpanded ? queuedTasks : queuedTasks.slice(0, 1)).map((task, idx) => {
              const stepNum = task.stepIndex ?? (activeStep ? (activeStep.stepIndex ?? 1) + 1 + idx : idx + 2);
              return (
                <div
                  key={task._id}
                  className="rounded-lg p-2.5 bg-[#0C0C0C] border border-[#1A1A1A] flex items-center justify-between transition-opacity"
                  style={{ opacity: isExpanded ? 1 - idx * 0.12 : 0.7 }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-[#555555] w-4">
                      {String(stepNum).padStart(2, "0")}
                    </span>
                    <div className="w-3.5 h-3.5 rounded-full border border-[#333333] shrink-0" />
                    <span className="text-[12px] text-[#A0A0A0]">{task.title}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#444444] px-1 rounded bg-[#0A0A0A]">
                    QUEUED
                  </span>
                </div>
              );
            })}

            {!isExpanded && queuedTasks.length > 1 && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-left text-[10px] font-mono text-[#555555] hover:text-[#888888] px-1 py-0.5 cursor-pointer"
              >
                + {queuedTasks.length - 1} more steps queued (click to expand)
              </button>
            )}
          </div>
        ) : (
          <p className="text-[11px] font-mono text-[#444444] italic">Pipeline is clear.</p>
        )}
      </div>

      {/* Completed Milestones (Subtle history) */}
      {completedTasks.length > 0 && (
        <div className="flex flex-col gap-1 pt-1 border-t border-[#141414]">
          <span className="text-[9px] font-mono text-[#444444] uppercase tracking-wider">
            COMPLETED MILESTONES ({completedTasks.length})
          </span>
          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto scrollbar-none">
            {completedTasks.map((t) => (
              <div
                key={t._id}
                className="flex items-center gap-2 text-[11px] text-[#555555] line-through py-0.5 px-1 font-mono"
              >
                <Check size={11} className="text-[#444444]" />
                <span>{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Step to this specific role */}
      <AddTask
        role={role.id}
        nextStepIndex={nextStepIndex}
        placeholder={`Add step ${nextStepIndex} to ${role.name}...`}
      />
    </div>
  );
}
