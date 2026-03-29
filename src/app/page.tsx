"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from "date-fns";
import { TaskItem } from "@/components/TaskItem";
import { AddTask } from "@/components/AddTask";
import { useEffect, useState } from "react";
import { soundEngine } from "@/lib/sounds";
import { Volume2, VolumeX } from "lucide-react";

export default function Home() {
  const tasks = useQuery(api.tasks.list);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remainingCount = tasks?.filter((t: any) => !t.completed).length ?? 0;
  const today = format(new Date(), "MMM d");
  const [isLoaded, setIsLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleClose = () => {
    setIsLoaded(false);
    if (soundEngine) soundEngine.click();
    setTimeout(() => {
      window.close();
    }, 80);
  };

  useEffect(() => {
    setIsLoaded(true);
    if (soundEngine) {
      soundEngine.enabled = soundEnabled;
      soundEngine.pop();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (soundEngine) {
      soundEngine.enabled = soundEnabled;
    }
  }, [soundEnabled]);

  return (
    <main 
      className={`min-h-screen w-full bg-[#000000] p-4 transition-opacity duration-150 ${isLoaded ? 'opacity-100 animate-overlay-in' : 'opacity-0'}`}
      suppressHydrationWarning
    >
      <div className={`w-full flex flex-col gap-6 transition-all duration-120 ${isLoaded ? 'animate-panel-in' : ''}`}>
        {/* Header */}
        <header className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-medium tracking-tight text-[#EAEAEA]">Today • {today}</h1>
            <p className="text-[#7A7A7A] text-[13px]">
              {remainingCount} {remainingCount === 1 ? "task" : "tasks"} remaining
            </p>
          </div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-[#4A4A4A] hover:text-[#7A7A7A] transition-colors p-1"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </header>

        {/* Task List (Small scrollable area if many tasks) */}
        <div className="flex flex-col max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {tasks?.map((task: any) => (
            <TaskItem key={task._id} task={task} />
          ))}
          {tasks && tasks.length === 0 && (
            <p className="text-[#4A4A4A] py-8 text-center text-[13px] italic animate-task-in">No tasks for today.</p>
          )}
        </div>

        {/* Add Task */}
        <AddTask />
      </div>
    </main>
  );
}
