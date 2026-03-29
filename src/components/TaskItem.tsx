"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format, isBefore, addHours, isToday, isTomorrow, formatDistanceToNowStrict } from "date-fns";
import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { soundEngine } from "@/lib/sounds";

interface TaskItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any; 
}

export function TaskItem({ task }: TaskItemProps) {
  const toggle = useMutation(api.tasks.toggle);
  const remove = useMutation(api.tasks.remove);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSoon = task.deadline && !task.completed && isBefore(task.deadline, addHours(new Date(), 1)) && isBefore(new Date(), task.deadline);

  const formatDeadline = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const timeRemaining = formatDistanceToNowStrict(date, { addSuffix: true });
    
    let dateStr = "";
    if (isToday(date)) {
      dateStr = format(date, "h:mm a");
    } else if (isTomorrow(date)) {
      dateStr = `Tomorrow ${format(date, "h:mm a")}`;
    } else {
      const diffTime = date.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      if (diffDays > 0 && diffDays < 7) {
        dateStr = format(date, "EEEE h:mm a");
      } else {
        dateStr = format(date, "dd/MM/yy h:mm a");
      }
    }
    return `${dateStr} • ${timeRemaining}`;
  };

  const handleToggle = () => {
    if (soundEngine) soundEngine.tap();
    toggle({ id: task._id });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      remove({ id: task._id });
    }, 100);
  };

  return (
    <div 
      className={`group flex flex-col cursor-default pb-1 pt-1 animate-task-in ${isDeleting ? 'animate-task-out pointer-events-none' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 py-2 px-4 -mx-1 rounded-xl hover:bg-[#111111] transition-colors duration-200">
        <button 
          onClick={handleToggle}
          className={`w-5 h-5 flex items-center justify-center border rounded-sm transition-all duration-100 ${
            task.completed ? "bg-[#4A4A4A] border-[#4A4A4A]" : "border-[#1A1A1A] group-hover:border-[#7A7A7A]"
          }`}
        >
          {task.completed && <Check size={14} className="text-black" />}
        </button>
        
        <div className="flex flex-col flex-1">
          <span className={`text-[#EAEAEA] transition-all duration-100 ${task.completed ? "text-[#4A4A4A] line-through decoration-[#4A4A4A]" : ""}`}>
            {task.title}
          </span>
          {task.deadline && (
            <span className={`text-[#7A7A7A] text-[12px] transition-all duration-100 ${task.completed ? "opacity-40" : ""}`}>
              {formatDeadline(task.deadline)}
              {isSoon && <span className="ml-2 text-white/40">• Soon</span>}
            </span>
          )}
        </div>

        {isHovered && (
          <button 
            onClick={handleDelete}
            className="text-[#4A4A4A] hover:text-[#7A7A7A] transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="h-px bg-[#1A1A1A] mt-2 mb-1" />
    </div>
  );
}
