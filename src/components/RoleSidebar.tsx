"use client";

import React, { useEffect } from "react";
import { ROLES, RoleDefinition } from "@/lib/roles";
import { soundEngine } from "@/lib/sounds";
import { Check, ChevronLeft } from "lucide-react";

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

      {/* Slide-out Square Monograms Dock (Spacious & Ergonomic) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[88px] sm:w-[92px] bg-[#070707] border-r border-[#1C1C1C] flex flex-col items-center justify-between pt-12 pb-8 z-50 transition-transform duration-150 ease-out shadow-[12px_0_35px_rgba(0,0,0,0.92)] ${
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
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelect(role)}
                  title={`${role.name} (${role.roleTitle})`}
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

                  {/* Active highlight bar on right border */}
                  {isActive && (
                    <div className="absolute -right-[19px] sm:-right-[21px] w-1.5 h-6 bg-white rounded-l" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom swipe/hide button with comfortable touch target */}
        <div className="flex flex-col items-center gap-1.5 text-[#444444]">
          <span className="text-[8px] font-mono uppercase tracking-widest text-[#555555]">
            HIDE
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
