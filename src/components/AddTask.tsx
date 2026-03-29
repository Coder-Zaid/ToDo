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

    // Parse natural language date
    const parsed = chrono.parse(taskTitle);
    let deadline: number | null = null;
    let cleanTitle = taskTitle;

    if (parsed.length > 0) {
      const date = parsed[0].start.date();
      deadline = date.getTime();
      if (taskTitle.endsWith(parsed[0].text)) {
        cleanTitle = taskTitle.slice(0, -parsed[0].text.length).trim();
      } else {
        cleanTitle = taskTitle.replace(parsed[0].text, "").replace(/\s\s+/g, ' ').trim();
      }
    }

    await add({ title: cleanTitle || taskTitle, deadline });
    
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
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
    </form>
  );
}
