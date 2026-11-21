"use client";

import React, { useEffect, useRef } from "react";
import { ROLES, RoleDefinition } from "@/lib/roles";
import { soundEngine } from "@/lib/sounds";
import { Check, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";

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

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const lastSwitchTime = useRef<number>(0);

  const switchToDown = () => {
    const nextIndex = (currentIndex + 1) % ROLES.length;
    if (soundEngine) soundEngine.magneticSnap();
    onSelectRole(ROLES[nextIndex].id);
  };

  const switchToUp = () => {
    const prevIndex = (currentIndex - 1 + ROLES.length) % ROLES.length;
    if (soundEngine) soundEngine.magneticSnap();
    onSelectRole(ROLES[prevIndex].id);
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

  const handleSelect = (role: RoleDefinition) => {
    if (soundEngine) soundEngine.magneticSnap();
    onSelectRole(role.id);
    if (soundEngine) soundEngine.slideOut();
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

  // Touch handlers attached directly to container & dock with non-passive touchAction: none
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const deltaY = currentY - touchStartY.current;
    const deltaX = currentX - touchStartX.current;
    const now = Date.now();

    // Prevent too-rapid re-triggering during drag
    if (now - lastSwitchTime.current < 110) return;

    // Real-time drag switching: 24px vertical movement steps down or up!
    if (Math.abs(deltaY) >= 24 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) {
        switchToDown();
      } else {
        switchToUp();
      }
      lastSwitchTime.current = now;
      // Reset startY so continuous drag keeps stepping cleanly
      touchStartY.current = currentY;
      touchStartX.current = currentX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;

    // Horizontal swipe left -> Close sidebar
    if (deltaX < -35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (soundEngine) soundEngine.slideOut();
      onClose();
      return;
    }

    // Quick flick fallback if touchmove didn't trigger
    if (Math.abs(deltaY) >= 18 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) {
        switchToDown();
      } else {
        switchToUp();
      }
    }
  };

  // Mouse wheel navigation on desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (Math.abs(e.deltaY) > 18) {
      if (e.deltaY > 0) {
        switchToDown();
      } else {
        switchToUp();
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
        onWheel={handleWheel}
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
            onClick={switchToUp}
            className="text-[#444444] hover:text-[#EAEAEA] p-0.5 transition-colors"
            title="Previous Role (Swipe Up)"
          >
            <ChevronUp size={14} />
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
                  className={`w-[52px] h-[52px] rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative group cursor-pointer ${
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

                  {/* Stealth Status Pip */}
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
                </button>
              );
            })}

            {/* Quick Down Arrow control */}
            <button
              onClick={switchToDown}
              className="text-[#444444] hover:text-[#EAEAEA] p-0.5 transition-colors"
              title="Next Role (Swipe Down)"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Bottom swipe/hide button */}
        <div className="flex flex-col items-center gap-1.5 text-[#444444]">
          <span className="text-[7px] font-mono uppercase tracking-widest text-[#555555]">
            ↕ SWIPE
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
