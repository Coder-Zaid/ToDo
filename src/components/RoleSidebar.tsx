"use client";

import React, { useEffect } from "react";
import { ROLES, RoleDefinition } from "@/lib/roles";
import { soundEngine } from "@/lib/sounds";
import { Check } from "lucide-react";

interface RoleSidebarProps {
  isOpen: boolean;
  activeRole: string;
  onSelectRole: (roleId: string) => void;
  onClose: () => void;
}

export function RoleSidebar({
  isOpen,
  activeRole,
  onSelectRole,
  onClose,
}: RoleSidebarProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (role: RoleDefinition) => {
    if (soundEngine) soundEngine.tap();
    onSelectRole(role.id);
    onClose(); // Automatically hides sidebar when chosen!
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
        className={`fixed top-0 left-0 bottom-0 w-[68px] bg-[#070707] border-r border-[#1C1C1C] flex flex-col items-center justify-between py-6 z-50 transition-transform duration-150 ease-out shadow-[10px_0_30px_rgba(0,0,0,0.85)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding / Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <Check size={14} className="text-black stroke-[3px]" />
          </div>

          <div className="w-6 h-[1px] bg-[#1F1F1F]" />

          {/* Square Monogram Letter Buttons */}
          <div className="flex flex-col gap-2.5 items-center">
            {ROLES.map((role) => {
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelect(role)}
                  title={`${role.name} (${role.roleTitle})`}
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-100 relative group cursor-pointer ${
                    isActive
                      ? "bg-white border border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.18)] scale-105"
                      : "bg-[#111111] border border-[#222222] text-[#7A7A7A] hover:text-[#EAEAEA] hover:border-[#383838]"
                  }`}
                >
                  <span
                    className={`font-mono text-sm leading-none ${
                      isActive ? "font-extrabold" : "font-bold"
                    }`}
                  >
                    {role.code}
                  </span>
                  <span
                    className={`text-[7px] font-mono tracking-tighter mt-0.5 ${
                      isActive ? "font-bold text-black/70" : "text-[#555555] group-hover:text-[#999999]"
                    }`}
                  >
                    {role.badge}
                  </span>

                  {/* Active highlight bar on right border */}
                  {isActive && (
                    <div className="absolute -right-[13px] w-1 h-5 bg-white rounded-l" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom swipe hint */}
        <div className="flex flex-col items-center gap-1 text-[#444444]">
          <span className="text-[8px] font-mono uppercase tracking-widest">HIDE</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#111111] border border-[#222222] flex items-center justify-center text-[#777777] hover:text-white transition-colors"
          >
            ←
          </button>
        </div>
      </aside>
    </>
  );
}
