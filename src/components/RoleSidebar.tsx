"use client";

import React, { useEffect, useRef } from "react";
import { ROLES, RoleDefinition } from "@/lib/roles";
import { soundEngine } from "@/lib/sounds";
import { Check, ChevronLeft } from "lucide-react";

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
  const currentIndex = ROLES.findIndex((r) => r.id === activeRole);

  const switchToDown = () => {
    const nextIndex = (currentIndex + 1) % ROLES.length;
    if (soundEngine) soundEngine.tap();
    onSelectRole(ROLES[nextIndex].id);
  };

  const switchToUp = () => {
    const prevIndex = (currentIndex - 1 + ROLES.length) % ROLES.length;
    if (soundEngine) soundEngine.tap();
    onSelectRole(ROLES[prevIndex].id);
  };

  // Keyboard navigation when sidebar is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        switchToDown();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        switchToUp();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeRole]);

  // Window-level touch listeners when sidebar is open
  // This guarantees swipes are never swallowed by buttons, backdrop, or browser scroll
  useEffect(() => {
    if (!isOpen) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isTracking = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTracking) return;
      const touch = e.touches[0];

      // Drag-scrub: If the user slides their finger directly over a role square, highlight it!
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const roleBtn = element?.closest("[data-role-id]");
      if (roleBtn) {
        const hoveredRoleId = roleBtn.getAttribute("data-role-id");
        if (hoveredRoleId && hoveredRoleId !== activeRole) {
          if (soundEngine) soundEngine.tap();
          onSelectRole(hoveredRoleId);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTracking) return;
      isTracking = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // 1. Horizontal swipe left -> Close sidebar
      if (deltaX < -35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (soundEngine) soundEngine.tap();
        onClose();
        return;
      }

      // 2. Vertical swipe:
      // Swipe DOWN (deltaY > 20): move to next profile down!
      if (deltaY > 20 && Math.abs(deltaY) > Math.abs(deltaX)) {
        switchToDown();
      }
      // Swipe UP (deltaY < -20): move to previous profile up!
      else if (deltaY < -20 && Math.abs(deltaY) > Math.abs(deltaX)) {
        switchToUp();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeRole]);

  const handleSelect = (role: RoleDefinition) => {
    if (soundEngine) soundEngine.tap();
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

  // Mouse wheel navigation on desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 20) {
      if (e.deltaY > 0) {
        switchToDown();
      } else {
        switchToUp();
      }
    }
  };

  return (
    <>
      {/* Backdrop overlay (dismiss on tap) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150 z-40 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-out Square Monograms Dock */}
      <aside
        onWheel={handleWheel}
        className={`fixed top-0 left-0 bottom-0 w-[88px] sm:w-[92px] bg-[#070707] border-r border-[#1C1C1C] flex flex-col items-center justify-between pt-12 pb-8 z-50 transition-transform duration-150 ease-out shadow-[12px_0_35px_rgba(0,0,0,0.92)] touch-none overscroll-none select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding / Logo with Safe Top Padding */}
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.12)]">
            <Check size={16} className="text-black stroke-[3px]" />
          </div>

          <div className="w-10 h-[1px] bg-[#1E1E1E]" />

          {/* Square Monogram Letter Buttons */}
          <div className="flex flex-col gap-3.5 items-center w-full px-3">
            {ROLES.map((role) => {
              const isActive = activeRole === role.id;
              const hasActiveTask = checkRoleActive(role.id);

              return (
                <button
                  key={role.id}
                  data-role-id={role.id}
                  onClick={() => handleSelect(role)}
                  title={`${role.name} (${role.roleTitle}) - ${
                    hasActiveTask ? "Step 1 In Progress" : "Idle"
                  }`}
                  className={`w-[52px] h-[52px] rounded-2xl flex flex-col items-center justify-center transition-all duration-120 relative group cursor-pointer ${
                    isActive
                      ? "bg-white border border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.18)] scale-105"
                      : "bg-[#111111] border border-[#222222] text-[#7A7A7A] hover:text-[#EAEAEA] hover:border-[#383838]"
                  }`}
                >
                  <span
                    className={`font-mono text-base leading-none ${
                      isActive ? "font-extrabold" : "font-bold"
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

                  {/* Stealth Status Pip: White dot = active Step 1, Dim dot = idle */}
                  <div
                    className={`w-[3px] h-[3px] rounded-full mt-1 transition-colors ${
                      hasActiveTask
                        ? isActive
                          ? "bg-black"
                          : "bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)]"
                        : isActive
                        ? "bg-black/25"
                        : "bg-[#252525]"
                    }`}
                  />

                  {/* Active highlight bar on right border */}
                  {isActive && (
                    <div className="absolute -right-[19px] sm:-right-[21px] w-1.5 h-6 bg-white rounded-l" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom vertical gesture indicator & hide button */}
        <div className="flex flex-col items-center gap-1.5 text-[#444444]">
          <span className="text-[7px] font-mono uppercase tracking-widest text-[#555555]">
            ↕ SWIPE
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#121212] border border-[#222222] flex items-center justify-center text-[#777777] hover:text-white transition-colors cursor-pointer"
            title="Hide Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
