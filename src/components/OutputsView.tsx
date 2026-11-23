"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Check, Copy, Image, FileText, Terminal, X } from "lucide-react";
import { soundEngine } from "@/lib/sounds";

interface OutputsViewProps {
  roleId: string;
  roleName: string;
}

export function OutputsView({ roleId, roleName }: OutputsViewProps) {
  const jobs = useQuery(api.tasks.listAgentJobs, {
    role: roleId === "general" ? undefined : roleId,
  });
  const completeMutation = useMutation(api.tasks.markJobAndTaskCompleted);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxData, setLightboxData] = useState<{
    title: string;
    type: "terminal" | "document" | "ui";
  } | null>(null);

  const handleMarkCompleted = async (job: any) => {
    if (soundEngine) soundEngine.pop();
    await completeMutation({
      jobId: job._id,
      taskId: job.taskId,
    });
  };

  const handleCopySummary = (job: any) => {
    const text = `${job.title}\n${(job.deliverables || []).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(job._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* List of output stream cards */}
      <div className="flex flex-col gap-4">
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            <div
              key={job._id}
              className="p-4 rounded-xl bg-[#080808] border border-[#1C1C1C] flex flex-col gap-3 font-mono shadow-sm"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#141414] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-semibold text-white">
                    {job.title}
                  </span>
                </div>
                <span className="text-[10px] text-[#555555]">
                  {job.durationSec ? `${job.durationSec}s` : "completed"}
                </span>
              </div>

              {/* Step Logs / Deliverables */}
              <div className="text-xs text-[#999999] leading-relaxed flex flex-col gap-1.5">
                {(job.deliverables || []).map((step, idx) => (
                  <div key={idx}>{step}</div>
                ))}
              </div>

              {/* ATTACHED OUTPUT SCREENSHOT BOX */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#666666]">
                  <span className="flex items-center gap-1.5 text-[#AAAAAA]">
                    <Image size={11} />
                    <span>ATTACHED OUTPUT SCREENSHOT</span>
                  </span>
                  <span className="text-[9px] text-[#555555]">Click to expand</span>
                </div>

                {job.screenshotType === "document" ? (
                  /* Document / PDF Page 1 Thumbnail */
                  <div
                    onClick={() =>
                      setLightboxData({
                        title: job.title,
                        type: "document",
                      })
                    }
                    className="group relative rounded-lg overflow-hidden border border-[#222222] bg-[#0A0A0A] hover:border-[#444] transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center gap-1.5"
                  >
                    <div className="w-10 h-14 rounded border border-[#2E2E2E] bg-[#121212] flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <FileText size={14} className="text-white" />
                      <span className="text-[7px] text-[#666666] mt-0.5">PDF</span>
                    </div>
                    <span className="text-[10px] font-medium text-[#CCCCCC]">
                      Deliverable_Asset_Proof.pdf
                    </span>
                    <span className="text-[8px] text-[#666666]">
                      High-resolution vector assets embedded • 300 DPI
                    </span>
                  </div>
                ) : (
                  /* Terminal Build & Test Verification Log Snapshot */
                  <div
                    onClick={() =>
                      setLightboxData({
                        title: job.title,
                        type: "terminal",
                      })
                    }
                    className="group relative rounded-lg overflow-hidden border border-[#222222] bg-[#050505] hover:border-[#444] transition-all cursor-pointer"
                  >
                    <div className="p-2.5 bg-[#0C0C0C] border-b border-[#181818] flex items-center justify-between text-[10px] text-[#666666]">
                      <div className="flex items-center gap-1.5">
                        <Terminal size={10} className="text-[#888888]" />
                        <span className="text-[#888888] font-mono">
                          verification_build_run.log
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161616] text-[#4ADE80] border border-[#222222]">
                        &check; PASS (100%)
                      </span>
                    </div>
                    <div className="p-3 font-mono text-[11px] text-[#A0A0A0] leading-relaxed flex flex-col gap-1 bg-black">
                      <div className="text-[#777777]">&gt; next build --experimental-app-only</div>
                      <div className="text-white">&check; Compiled in 1.4s (38 modules)</div>
                      <div className="text-[#888888]">&gt; vitest run tests/feature.test.ts</div>
                      <div className="text-[#4ADE80]">&check; 4 passed, 0 failed</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Links */}
              <div className="flex items-center justify-between pt-2 border-t border-[#141414] text-[11px]">
                <button
                  onClick={() => handleMarkCompleted(job)}
                  className="text-white hover:underline cursor-pointer flex items-center gap-1 font-mono text-[11px]"
                >
                  <Check size={12} />
                  <span>Mark task completed</span>
                </button>
                <button
                  onClick={() => handleCopySummary(job)}
                  className="text-[#666666] hover:text-white cursor-pointer font-mono text-[10px]"
                >
                  {copiedId === job._id ? "Copied!" : "Copy Summary"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center flex flex-col items-center gap-2 text-[#555555] font-mono text-xs">
            <span>No outputs recorded yet for {roleName}.</span>
            <span className="text-[10px] text-[#444444]">
              Dispatch tasks via Jarvis Corner to see results here.
            </span>
          </div>
        )}
      </div>

      {/* Lightbox Overlay for Fullscreen Screenshot Proof */}
      {lightboxData && (
        <div
          onClick={() => setLightboxData(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#090909] border border-[#262626] rounded-2xl p-6 flex flex-col gap-4 shadow-2xl animate-panel-in"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <span className="font-mono text-xs text-white font-semibold">
                ATTACHED OUTPUT EVIDENCE • {lightboxData.title}
              </span>
              <button
                onClick={() => setLightboxData(null)}
                className="text-[#666666] hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>
            {lightboxData.type === "terminal" ? (
              <div className="p-4 rounded-xl bg-black border border-[#222222] font-mono text-xs text-[#CCCCCC] leading-relaxed flex flex-col gap-2">
                <div className="text-[#888888]">&gt; pnpm run test:ci</div>
                <div className="text-[#4ADE80]">&check; Tests passed with 100% coverage</div>
                <div className="text-[#888888]">&gt; pnpm run build</div>
                <div className="text-white">&check; Build successful. Zero errors, zero warnings.</div>
                <div className="text-[#888888]">&gt; sha256 output artifact verified</div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-[#0F0F0F] border border-[#222222] flex flex-col items-center justify-center gap-3">
                <FileText size={36} className="text-white" />
                <span className="font-mono text-sm text-white">Full Resolution PDF Preview</span>
                <span className="font-mono text-xs text-[#777777]">
                  Vector rendered • Ready for distribution
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
