"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { ROLES, RoleDefinition, sortRolesByDeadline, getRoleClosestDeadline } from "@/lib/roles";
import { soundEngine } from "@/lib/sounds";
import { Check, ChevronLeft, ChevronUp, ChevronDown, Clock } from "lucide-react";

interface RoleSidebarProps {
  isOpen: boolean;
  activeRole: string;
  onSelectRole: (roleId: string) => void;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks?: any[];
}

export function RoleSidebar({
  isOpen,
  activeRole,
  onSelectRole,
  onClose,
  tasks,
}: RoleSidebarProps) {
  // Always-fresh ref for activeRole to eliminate any stale closure issues
  const activeRoleRef = useRef(activeRole);
  activeRoleRef.current = activeRole;

  const isSwitchingRef = useRef(false);

  // Dynamically sort roles by closest deadline
  const sortedRoles = useMemo(() => {
    return sortRolesByDeadline(ROLES, tasks);
  }, [tasks]);

  const currentIndex = sortedRoles.findIndex((r) => r.id === activeRole);

  // Switch to next profile and IMMEDIATELY auto-hide the sidebar (1 scroll = 1 switch & close)
  const switchToDownAndClose = () => {
    if (isSwitchingRef.current) return;
    isSwitchingRef.current = true;

    // Explicitly blur any input to prevent mobile virtual keyboard from popping up
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const idx = sortedRoles.findIndex((r) => r.id === activeRoleRef.current);
    const nextIndex = (idx + 1) % sortedRoles.length;

    if (soundEngine) {
      soundEngine.magneticSnap();
      soundEngine.slideOut();
    }

    onSelectRole(sortedRoles[nextIndex].id);
    onClose(); // Self-hide immediately!

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 200);
  };

  // Switch to previous profile and IMMEDIATELY auto-hide the sidebar
  const switchToUpAndClose = () => {
    if (isSwitchingRef.current) return;
    isSwitchingRef.current = true;

    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const idx = sortedRoles.findIndex((r) => r.id === activeRoleRef.current);
    const prevIndex = (idx - 1 + sortedRoles.length) % sortedRoles.length;

    if (soundEngine) {
      soundEngine.magneticSnap();
      soundEngine.slideOut();
    }

    onSelectRole(sortedRoles[prevIndex].id);
    onClose(); // Self-hide immediately!

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 200);
  };

  // Keyboard navigation when sidebar is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        if (soundEngine) soundEngine.slideOut();
        onClose();
      } else if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        switchToDownAndClose();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        switchToUpAndClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Global mouse wheel listener across the ENTIRE window when sidebar is open
  useEffect(() => {
    if (!isOpen) return;

    let wheelAccumulator = 0;

    const handleGlobalWheel = (e: WheelEvent) => {
      e.preventDefault();

      wheelAccumulator += e.deltaY;

      // Scroll down once: switch to next role and self-hide immediately!
      if (wheelAccumulator >= 14) {
        wheelAccumulator = 0;
        switchToDownAndClose();
      }
      // Scroll up once: switch to previous role and self-hide immediately!
      else if (wheelAccumulator <= -14) {
        wheelAccumulator = 0;
        switchToUpAndClose();
      }
    };

    window.addEventListener("wheel", handleGlobalWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleGlobalWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Global Touch swipe & drag listener across the ENTIRE window when sidebar is open
  useEffect(() => {
    if (!isOpen) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isTracking = true;
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isTracking || e.touches.length !== 1) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const deltaY = currentY - startY;
      const deltaX = currentX - startX;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!isTracking) return;
      isTracking = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Swipe left -> Close sidebar
      if (deltaX < -35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (soundEngine) soundEngine.slideOut();
        onClose();
        return;
      }

      // Intentional swipe DOWN -> switch next & close
      if (deltaY >= 35 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        switchToDownAndClose();
      }
      // Intentional swipe UP -> switch prev & close
      else if (deltaY <= -35 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        switchToUpAndClose();
      }
    };

    window.addEventListener("touchstart", handleGlobalTouchStart, { passive: true });
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
    window.addEventListener("touchend", handleGlobalTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleGlobalTouchStart);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSelect = (role: RoleDefinition) => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (soundEngine) {
      soundEngine.magneticSnap();
      soundEngine.slideOut();
    }
    onSelectRole(role.id);
    onClose(); // Automatically hides sidebar when chosen!
  };

  const checkRoleActive = (roleId: string) => {
    if (!tasks) return false;
    if (roleId === "general") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return tasks.some((t: any) => (!t.role || t.role === "general") && !t.completed);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return tasks.some((t: any) => t.role === roleId && !t.completed);
  };

  return (
    <div
      style={{ touchAction: "none" }}
      className={`fixed inset-0 z-50 transition-opacity duration-150 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop overlay (dismiss on tap) */}
      <div
        onClick={() => {
          if (soundEngine) soundEngine.slideOut();
          onClose();
        }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      {/* Slide-out Square Monograms Dock with Magnetic Animation */}
      <aside
        className={`absolute top-0 left-0 bottom-0 w-[88px] sm:w-[92px] bg-[#070707] border-r border-[#1C1C1C] flex flex-col items-center justify-between pt-10 pb-8 z-50 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[15px_0_40px_rgba(0,0,0,0.95)] select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding / Logo */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <Check size={16} className="text-black stroke-[3px]" />
          </div>

          <div className="w-10 h-[1px] bg-[#1E1E1E]" />

          {/* Quick Up Arrow control */}
          <button
            onClick={switchToUpAndClose}
            className="text-[#444444] hover:text-[#EAEAEA] p-0.5 transition-colors cursor-pointer"
            title="Previous Role (Scroll Up & Close)"
          >
            <ChevronUp size={16} />
          </button>

          {/* Square Monogram Letter Buttons Container */}
          <div className="relative flex flex-col gap-3.5 items-center w-full px-3">
            {/* Magnetic Gliding Indicator Rail on right edge */}
            <div
              className="absolute -right-[13px] sm:-right-[15px] w-1.5 h-6 bg-white rounded-l transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
              style={{
                transform: `translateY(${currentIndex * 66 + 13}px)`,
              }}
            />

            {sortedRoles.map((role) => {
              const isActive = activeRole === role.id;
              const hasActiveTask = checkRoleActive(role.id);
              const closestDeadline = getRoleClosestDeadline(role.id, tasks);
              const hasDeadline = closestDeadline !== null;

              const deadlineLabel = closestDeadline
                ? closestDeadline - Date.now() <= 0
                  ? "Overdue"
                  : Math.floor((closestDeadline - Date.now()) / (1000 * 60 * 60 * 24)) > 0
                  ? `${Math.floor((closestDeadline - Date.now()) / (1000 * 60 * 60 * 24))}d left`
                  : `${Math.floor((closestDeadline - Date.now()) / (1000 * 60 * 60))}h left`
                : null;

              return (
                <button
                  key={role.id}
                  type="button"
                  data-role-id={role.id}
                  onClick={() => handleSelect(role)}
                  title={`${role.name} (${role.roleTitle}) - ${
                    deadlineLabel
                      ? `Due in ${deadlineLabel}`
                      : hasActiveTask
                      ? "Step 1 In Progress"
                      : "Idle"
                  }`}
                  className={`w-[52px] h-[52px] rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative group cursor-pointer touch-manipulation select-none ${
                    isActive
                      ? "bg-white border border-white text-black shadow-[0_0_22px_rgba(255,255,255,0.22)] scale-105"
                      : "bg-[#111111] border border-[#222222] text-[#7A7A7A] hover:text-[#EAEAEA] hover:border-[#383838] active:scale-95"
                  }`}
                >
                  <span
                    className={`font-mono text-base leading-none transition-transform duration-200 ${
                      isActive ? "font-extrabold scale-105" : "font-bold"
                    }`}
                  >
                    {role.code}
                  </span>
                  <span
                    className={`text-[8px] font-mono tracking-wider mt-0.5 ${
                      isActive
                        ? "font-bold text-black/75"
                        : "text-[#555555] group-hover:text-[#999999]"
                    }`}
                  >
                    {role.badge}
                  </span>

                  {/* Dynamic Deadline Urgency Dot or Status Pip */}
                  <div
                    className={`w-[3px] h-[3px] rounded-full mt-1 transition-colors ${
                      hasDeadline
                        ? isActive
                          ? "bg-black"
                          : "bg-white shadow-[0_0_6px_rgba(255,255,255,1)]"
                        : hasActiveTask
                        ? isActive
                          ? "bg-black"
                          : "bg-[#9A9A9A] shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                        : isActive
                        ? "bg-black/25"
                        : "bg-[#252525]"
                    }`}
                  />
                </button>
              );
            })}

            {/* Quick Down Arrow control */}
            <button
              onClick={switchToDownAndClose}
              className="text-[#444444] hover:text-[#EAEAEA] p-0.5 transition-colors cursor-pointer"
              title="Next Role (Scroll Down & Close)"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Bottom vertical gesture indicator & hide button */}
        <div className="flex flex-col items-center gap-1.5 text-[#444444]">
          <span className="text-[7px] font-mono uppercase tracking-widest text-[#555555]">
            ↕ SCROLL
          </span>
          <button
            onClick={() => {
              if (soundEngine) soundEngine.slideOut();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-[#121212] border border-[#222222] flex items-center justify-center text-[#777777] hover:text-white transition-colors cursor-pointer"
            title="Hide Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
}
