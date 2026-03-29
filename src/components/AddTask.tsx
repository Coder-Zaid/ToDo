"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import * as chrono from "chrono-node";
import { soundEngine } from "@/lib/sounds";

export function AddTask() {
  const add = useMutation(api.tasks.add);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Force focus on mount
    const focus = () => inputRef.current?.focus();
    focus();
    // Re-focus after a short delay to ensure it catches even if browser is slow
    const timer = setTimeout(focus, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskTitle = title.trim();
    if (!taskTitle) return;

    // Play tick sound
    if (soundEngine) soundEngine.tick();

    // Clear UI instantly for better feel
    setTitle("");

    // Custom interception for "before" patterns
    // 1. Handle "before [Day] [Month]" -> remove "before" so chrono sees "[Day] [Month]"
    const beforeDayMonthRegex = /\bbefore\s+(\d+)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/gi;
    let processingTitle = taskTitle.replace(beforeDayMonthRegex, "$1 $2");

    // 2. Handle "before [Month]" (no day) -> "1 [Month]"
    const beforeMonthRegex = /\bbefore\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/gi;
    processingTitle = processingTitle.replace(beforeMonthRegex, "1 $1");

    // Parse natural language date
    const parsed = chrono.parse(processingTitle);
    let deadline: number | null = null;
    let cleanTitle = taskTitle;

    if (parsed.length > 0) {
      const result = parsed[0];
      const date = result.start.date();
      
      // If the user didn't specify a time, default to end-of-day (23:59:59)
      if (!result.start.isCertain("hour") && !result.start.isCertain("minute")) {
        date.setHours(23, 59, 59, 999);
      }
      
      deadline = date.getTime();
      
      const matchedText = parsed[0].text;
      const index = parsed[0].index;
      const prefix = processingTitle.substring(0, index);
      const suffix = processingTitle.substring(index + matchedText.length);

      // Remove "by" or "before" (case-insensitive) if it precedes the date/time
      const prepPattern = /\b(by|before)\s*$/i;
      if (prepPattern.test(prefix.trimEnd())) {
        const cleanPrefix = prefix.trimEnd().replace(prepPattern, "");
        cleanTitle = (cleanPrefix + suffix).replace(/\s\s+/g, " ").trim();
      } else {
        cleanTitle = (prefix + suffix).replace(/\s\s+/g, " ").trim();
      }
    }

    // Always capitalize every word in the title
    const rawTitle = (cleanTitle && cleanTitle.trim().length > 0) ? cleanTitle : taskTitle;
    const finalTitle = rawTitle
      .trim()
      .replace(/\s\s+/g, " ")
      .split(" ")
      .map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");

    await add({ title: finalTitle, deadline });
    
    // Ensure input stays focused
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 animate-task-in">
      <div className="flex items-center gap-3">
        <span className="text-[#4A4A4A] text-xl font-light">+</span>
        <input
          ref={inputRef}
          type="text"
          autoFocus={true}
          placeholder="Type task... (e.g. clean room tomorrow 5pm)"
          className="bg-transparent text-[#EAEAEA] placeholder-[#4A4A4A] py-1.5 w-full outline-none text-sm transition-all"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (soundEngine) soundEngine.type();
          }}
        />
      </div>
    </form>
  );
}
