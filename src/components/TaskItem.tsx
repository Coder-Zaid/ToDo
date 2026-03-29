"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format, isBefore, addHours, isToday, isTomorrow, formatDistanceToNowStrict } from "date-fns";
import { Check, Trash2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/sounds";

interface TaskItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any; 
}

export function TaskItem({ task }: TaskItemProps) {
  const toggle = useMutation(api.tasks.toggle);
  const remove = useMutation(api.tasks.remove);
  const updateTask = useMutation(api.tasks.update);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const isSoon = task.deadline && !task.completed && isBefore(task.deadline, addHours(new Date(), 1)) && isBefore(new Date(), task.deadline);

  const handleUpdate = async () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title) {
      // Capitalize edit too
      const capitalized = trimmed
        .split(/\s+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      
      if (soundEngine) soundEngine.tick();
      await updateTask({ id: task._id, title: capitalized });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUpdate();
    if (e.key === "Escape") {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };

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
    if (isEditing) return;
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
      <div 
        onClick={handleToggle}
        className="flex items-center gap-3 py-2 px-4 -mx-1 rounded-xl cursor-pointer hover:bg-[#111111] transition-colors duration-200"
      >
        <div 
          className={`w-5 h-5 flex items-center justify-center border rounded-sm transition-all duration-100 ${
            task.completed ? "bg-[#4A4A4A] border-[#4A4A4A]" : "border-[#1A1A1A] group-hover:border-[#7A7A7A]"
          }`}
        >
          {task.completed && <Check size={14} className="text-black" />}
        </div>
        
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 group/title">
            {isEditing ? (
              <input
                ref={inputRef}
                className="bg-transparent text-[#EAEAEA] outline-none border-b border-[#333] w-full py-0.5"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleUpdate}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={`text-[#EAEAEA] transition-all duration-100 ${task.completed ? "text-[#4A4A4A] line-through decoration-[#4A4A4A]" : ""}`}>
                {task.title}
              </span>
            )}
            {!isEditing && isHovered && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#4A4A4A] hover:text-[#7A7A7A] transition-all"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
          {task.deadline && (
            <span className={`text-[#7A7A7A] text-[12px] transition-all duration-100 ${task.completed ? "opacity-40" : ""}`}>
              {formatDeadline(task.deadline)}
              {isSoon && <span className="ml-2 text-white/40">• Soon</span>}
            </span>
          )}
        </div>

        {isHovered && !isEditing && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 text-[#4A4A4A] hover:text-[#7A7A7A] transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="h-px bg-[#1A1A1A] mt-2 mb-1" />
    </div>
  );
}
