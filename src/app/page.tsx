"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from "date-fns";
import { TaskItem } from "@/components/TaskItem";
import { AddTask } from "@/components/AddTask";
import { NotificationToggle } from "@/components/NotificationToggle";
import { useEffect, useState, useRef } from "react";
import { soundEngine } from "@/lib/sounds";
import { Volume2, VolumeX, Check } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { RoleSidebar } from "@/components/RoleSidebar";
import { RoleWorkspace } from "@/components/RoleWorkspace";

export default function Home() {
  const tasks = useQuery(api.tasks.list);
  const [currentRoleId, setCurrentRoleId] = useState<string>("general");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [today, setToday] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Swipe detection coordinates
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const activeRole = ROLES.find((r) => r.id === currentRoleId) ?? ROLES[0];

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

  useEffect(() => {
    setToday(format(new Date(), "MMM d"));
    setIsLoaded(true);
    if (soundEngine) {
      soundEngine.enabled = soundEnabled;
      soundEngine.pop();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
        } else {
          handleClose();
        }
      }
      // Stealth desktop shortcut: press '[' or 'Alt+S' to toggle sidebar
      if (e.key === "[" || (e.altKey && e.key.toLowerCase() === "s")) {
        if (soundEngine) soundEngine.tap();
        setIsSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSidebarOpen]);

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

    if (isSidebarOpen) {
      // Swipe left -> close sidebar
      if (deltaX < -35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (soundEngine) soundEngine.tap();
        setIsSidebarOpen(false);
      }
      // Swipe DOWN -> switch to next profile down!
      else if (deltaY > 20 && Math.abs(deltaY) > Math.abs(deltaX)) {
        const currentIndex = ROLES.findIndex((r) => r.id === currentRoleId);
        const nextIndex = (currentIndex + 1) % ROLES.length;
        if (soundEngine) soundEngine.tap();
        setCurrentRoleId(ROLES[nextIndex].id);
      }
      // Swipe UP -> switch to previous profile up!
      else if (deltaY < -20 && Math.abs(deltaY) > Math.abs(deltaX)) {
        const currentIndex = ROLES.findIndex((r) => r.id === currentRoleId);
        const prevIndex = (currentIndex - 1 + ROLES.length) % ROLES.length;
        if (soundEngine) soundEngine.tap();
        setCurrentRoleId(ROLES[prevIndex].id);
      }
    } else {
      // When closed: swipe horizontally (left OR right with > 40px) -> open sidebar
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (soundEngine) soundEngine.tap();
        setIsSidebarOpen(true);
      }
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

      <div
        className={`w-full flex flex-col gap-6 transition-all duration-120 ${
          isLoaded ? "animate-panel-in" : ""
        }`}
      >
        {/* Stealth Top Header / Logo */}
        <div className="flex items-center justify-between mb-1 animate-task-in">
          <div
            onClick={() => {
              if (soundEngine) soundEngine.tap();
              setIsSidebarOpen(!isSidebarOpen);
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

          <div className="flex items-center gap-1.5">
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

            {/* Task List (Small scrollable area if many tasks) */}
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
    </main>
  );
}
