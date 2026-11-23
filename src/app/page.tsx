"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from "date-fns";
import { TaskItem } from "@/components/TaskItem";
import { AddTask } from "@/components/AddTask";
import { NotificationToggle } from "@/components/NotificationToggle";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { soundEngine } from "@/lib/sounds";
import { Volume2, VolumeX, Check, Mail } from "lucide-react";
import { ROLES, sortRolesByDeadline } from "@/lib/roles";
import { RoleSidebar } from "@/components/RoleSidebar";
import { RoleWorkspace } from "@/components/RoleWorkspace";
import { InboxTriageModal } from "@/components/InboxTriageModal";
import { JarvisCornerDrawer } from "@/components/JarvisCornerDrawer";
import { JarvisDispatchDrawer } from "@/components/JarvisDispatchDrawer";
import { OutputsView } from "@/components/OutputsView";

export default function Home() {
  const tasks = useQuery(api.tasks.list);
  const [currentRoleId, setCurrentRoleId] = useState<string>("general");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [today, setToday] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Stealth Modes: "todo" | "outputs"
  const [viewMode, setViewMode] = useState<"todo" | "outputs">("todo");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Hidden Modules & Modals
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isCornerOpen, setIsCornerOpen] = useState(false);
  const [dispatchTask, setDispatchTask] = useState<any | null>(null);

  // Triple Click detection
  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  // Swipe detection coordinates
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Dynamically sort roles by closest uncompleted deadline
  const sortedRoles = useMemo(() => {
    return sortRolesByDeadline(ROLES, tasks as any);
  }, [tasks]);

  const activeRole = sortedRoles.find((r) => r.id === currentRoleId) ?? sortedRoles[0];

  // Filter tasks for the General view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generalTasks = tasks?.filter((t: any) => !t.role || t.role === "general") ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remainingCount = generalTasks.filter((t: any) => !t.completed).length;

  const handleClose = () => {
    setIsLoaded(false);
    if (soundEngine) soundEngine.click();
    setTimeout(() => {
      window.close();
    }, 80);
  };

  // Stealth Mode Flip with 3D Depth Zoom Transition
  const toggleViewMode = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    if (soundEngine) soundEngine.magneticSnap();

    setViewMode((prev) => (prev === "todo" ? "outputs" : "todo"));
    setTimeout(() => {
      setIsTransitioning(false);
    }, 460);
  }, [isTransitioning]);

  useEffect(() => {
    setToday(format(new Date(), "MMM d"));
    setIsLoaded(true);
    if (soundEngine) {
      soundEngine.enabled = soundEnabled;
      soundEngine.pop();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dispatchTask) {
          setDispatchTask(null);
        } else if (isCornerOpen) {
          setIsCornerOpen(false);
        } else if (isInboxModalOpen) {
          setIsInboxModalOpen(false);
        } else if (isSidebarOpen) {
          if (soundEngine) soundEngine.slideOut();
          setIsSidebarOpen(false);
        } else {
          handleClose();
        }
      }
      // Stealth desktop shortcut: press '[' or 'Alt+S' to toggle sidebar
      if (e.key === "[" || (e.altKey && e.key.toLowerCase() === "s")) {
        if (isSidebarOpen) {
          if (soundEngine) soundEngine.slideOut();
          setIsSidebarOpen(false);
        } else {
          if (soundEngine) soundEngine.slideIn();
          setIsSidebarOpen(true);
        }
      }
    };

    // Stealth Triple-Click Listener for Mode Flip
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest(".drawer-right")
      ) {
        return;
      }

      clickCount.current += 1;
      if (clickCount.current === 1) {
        clickTimer.current = setTimeout(() => {
          clickCount.current = 0;
        }, 450);
      } else if (clickCount.current === 3) {
        if (clickTimer.current) clearTimeout(clickTimer.current);
        clickCount.current = 0;
        toggleViewMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleDocumentClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [isSidebarOpen, isCornerOpen, isInboxModalOpen, dispatchTask, toggleViewMode, soundEnabled]);

  useEffect(() => {
    if (soundEngine) {
      soundEngine.enabled = soundEnabled;
    }
  }, [soundEnabled]);

  // Touch Swipe Handlers for mobile & trackpads
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Corner drawer open: swipe left-to-right closes it
    if (isCornerOpen) {
      if (deltaX > 35) {
        setIsCornerOpen(false);
      }
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    if (isSidebarOpen) {
      // Swipe right-to-left -> close sidebar
      if (deltaX < -35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (soundEngine) soundEngine.slideOut();
        setIsSidebarOpen(false);
      }
      // Note: Profile selection and vertical swipe inside sidebar is handled directly by RoleSidebar
    } else {
      // Main screen horizontal gestures:
      // Swipe LEFT TO RIGHT (deltaX > 45) -> opens sidebar!
      if (deltaX > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        if (soundEngine) soundEngine.slideIn();
        setIsSidebarOpen(true);
      }
      // Swipe RIGHT TO LEFT (deltaX < -45) -> opens hidden Jarvis Corner!
      else if (deltaX < -45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        if (soundEngine) soundEngine.slideIn();
        setIsCornerOpen(true);
      }
      // Note: Vertical drags (deltaY) are NOT intercepted here so the task list & outputs scroll naturally!
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <main
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`min-h-screen w-full bg-[#000000] p-4 transition-opacity duration-150 relative ${
        isLoaded ? "opacity-100 animate-overlay-in" : "opacity-0"
      }`}
      suppressHydrationWarning
    >
      {/* Hidden Swipe-in Role Dock */}
      <RoleSidebar
        isOpen={isSidebarOpen}
        activeRole={currentRoleId}
        tasks={(tasks as any) ?? []}
        onSelectRole={(roleId) => {
          setCurrentRoleId(roleId);
        }}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Shared Backdrop for Drawers */}
      {(isCornerOpen || dispatchTask) && (
        <div
          onClick={() => {
            setIsCornerOpen(false);
            setDispatchTask(null);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-[2px] z-40 transition-opacity"
        />
      )}

      {/* Hidden Jarvis Corner Drawer (Swipe Right from any profile) */}
      <JarvisCornerDrawer
        isOpen={isCornerOpen}
        onClose={() => setIsCornerOpen(false)}
        tasks={(tasks as any) ?? []}
        onSelectTaskToDispatch={(t) => {
          setIsCornerOpen(false);
          setDispatchTask(t);
        }}
      />

      {/* Hidden Jarvis Dispatch Drawer (Opens when user gives task to Jarvis) */}
      <JarvisDispatchDrawer
        isOpen={Boolean(dispatchTask)}
        onClose={() => setDispatchTask(null)}
        task={dispatchTask}
        onExecuted={() => {
          if (viewMode !== "outputs") {
            toggleViewMode();
          }
        }}
      />

      {/* Inbox Message Triage Modal (Only Visible Button Action) */}
      <InboxTriageModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        defaultRole={currentRoleId}
      />

      <div
        className={`w-full flex flex-col gap-6 transition-all duration-120 ${
          isLoaded ? "animate-panel-in" : ""
        }`}
      >
        {/* Stealth Top Header / Logo */}
        <div className="flex items-center justify-between mb-1 animate-task-in">
          <div
            onClick={() => {
              if (isSidebarOpen) {
                if (soundEngine) soundEngine.slideOut();
                setIsSidebarOpen(false);
              } else {
                if (soundEngine) soundEngine.slideIn();
                setIsSidebarOpen(true);
              }
            }}
            className="flex items-center gap-2 cursor-pointer group"
            title="Click to switch role dock"
          >
            <div className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
              {currentRoleId === "general" ? (
                <Check size={14} className="text-black stroke-[3px]" />
              ) : (
                <span className="font-mono text-xs font-black text-black">
                  {activeRole.code}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#EAEAEA] group-hover:text-white transition-colors">
                {currentRoleId === "general" ? "ToDo" : activeRole.name}
              </span>
              <div className="h-[1px] w-full bg-gradient-to-r from-white/20 to-transparent" />
            </div>
          </div>

          {/* Controls: The ONLY visible action button (Scan Messages) + sound/notifications */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInboxModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F0F0F] border border-[#222222] text-[#888888] hover:text-white hover:border-[#444] transition-colors text-xs font-mono text-[10px] cursor-pointer"
              title="Scan messages for tasks"
            >
              <Mail size={11} />
              <span>Scan Messages</span>
            </button>

            <NotificationToggle />
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-[#4A4A4A] hover:text-[#7A7A7A] transition-colors p-1"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* 3D STAGE CONTAINER: Houses the Dual Modes (TODO & OUTPUTS) */}
        <div className="stage-3d relative w-full min-h-[420px]">
          {/* ========================================================= */}
          {/* VIEW A: TODO MODE                                         */}
          {/* ========================================================= */}
          <div
            className={`view-layer w-full flex flex-col gap-6 absolute top-0 left-0 right-0 ${
              viewMode === "todo"
                ? isTransitioning
                  ? "anim-zoom-in-down"
                  : ""
                : isTransitioning
                ? "anim-zoom-out-up"
                : "hidden"
            }`}
            style={{ display: viewMode === "todo" || isTransitioning ? "flex" : "none" }}
          >
            {/* View Mode Switching: Ordinary General vs. Executive Role Workspace */}
            {currentRoleId === "general" ? (
              <>
                {/* Header */}
                <header className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <h1 className="text-xl font-medium tracking-tight text-[#EAEAEA]">
                      Today • {today}
                    </h1>
                    <p className="text-[#7A7A7A] text-[13px]">
                      {remainingCount} {remainingCount === 1 ? "task" : "tasks"} remaining
                    </p>
                  </div>
                </header>

                {/* Task List */}
                <div className="flex flex-col max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {generalTasks.map((task: any) => (
                    <TaskItem key={task._id} task={task} />
                  ))}
                  {generalTasks.length === 0 && (
                    <p className="text-[#4A4A4A] py-8 text-center text-[13px] italic animate-task-in">
                      No tasks for today.
                    </p>
                  )}
                </div>

                {/* Add Task */}
                <AddTask role="general" />
              </>
            ) : (
              /* Executive Role Workspace (Single Step 1 Focus + Expandable Roadmap) */
              <RoleWorkspace
                role={activeRole}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tasks={(tasks as any) ?? []}
                onOpenSidebar={() => setIsSidebarOpen(true)}
              />
            )}
          </div>

          {/* ========================================================= */}
          {/* VIEW B: OUTPUTS MODE (STEALTH 3D DEPTH FLIP)              */}
          {/* ========================================================= */}
          <div
            className={`view-layer w-full flex flex-col gap-4 absolute top-0 left-0 right-0 ${
              viewMode === "outputs"
                ? isTransitioning
                  ? "anim-zoom-in-up"
                  : ""
                : isTransitioning
                ? "anim-zoom-out-down"
                : "hidden"
            }`}
            style={{ display: viewMode === "outputs" || isTransitioning ? "flex" : "none" }}
          >
            {/* Context Subtitle */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#555555] border-b border-[#141414] pb-2">
              <span className="uppercase text-[#888888]">
                {activeRole.name} • EXECUTION STREAM & EVIDENCE
              </span>
              <span>DELIVERABLES</span>
            </div>

            {/* Dedicated Outputs Stream for the Active Profile */}
            <OutputsView roleId={currentRoleId} roleName={activeRole.name} />
          </div>
        </div>
      </div>
    </main>
  );
}
