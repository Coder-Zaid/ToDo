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
  const [isSaving, setIsSaving] = useState(false);
  const [isSoon, setIsSoon] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    // Calculate isSoon only on client to avoid hydration mismatch
    const checkSoon = () => {
      const soon = task.deadline && !task.completed && isBefore(task.deadline, addHours(new Date(), 1)) && isBefore(new Date(), task.deadline);
      setIsSoon(!!soon);
    };
    checkSoon();
    const interval = setInterval(checkSoon, 60000);
    return () => clearInterval(interval);
  }, [task.deadline, task.completed]);

  const handleUpdate = async () => {
    if (isSaving) return;
    const trimmed = editedTitle.trim();
    
    if (trimmed && trimmed !== task.title) {
      setIsSaving(true);
      const capitalized = trimmed
        .split(/\s+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      
      if (soundEngine) soundEngine.tick();
      await updateTask({ id: task._id, title: capitalized });
    }
    setIsEditing(false);
    setIsSaving(false);
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
        className="flex items-center gap-3 py-2 px-3 sm:px-4 -mx-1 rounded-xl hover:bg-[#111111] transition-colors duration-200"
      >
        {/* Dedicated Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className="p-1 -m-1 flex items-center justify-center focus:outline-none cursor-pointer"
          title={task.completed ? "Mark incomplete" : "Mark completed"}
        >
          <div 
            className={`w-5 h-5 flex items-center justify-center border rounded-sm transition-all duration-100 ${
              task.completed ? "bg-[#4A4A4A] border-[#4A4A4A]" : "border-[#2A2A2A] group-hover:border-[#7A7A7A]"
            }`}
          >
            {task.completed && <Check size={14} className="text-black" />}
          </div>
        </button>
        
        {/* Title area: tapping/clicking enters edit mode */}
        <div 
          className="flex flex-col flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            if (!isEditing && !task.completed) {
              setEditedTitle(task.title);
              setIsEditing(true);
            }
          }}
        >
          <div className="flex items-center gap-2 group/title">
            {isEditing ? (
              <input
                ref={inputRef}
                className="bg-transparent text-[#EAEAEA] outline-none border-b border-[#444] w-full py-0.5"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleUpdate}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={`text-[#EAEAEA] transition-all duration-100 break-words ${task.completed ? "text-[#4A4A4A] line-through decoration-[#4A4A4A]" : ""}`}>
                {task.title}
              </span>
            )}
          </div>
          {task.deadline && (
            <span className={`text-[#7A7A7A] text-[12px] transition-all duration-100 ${task.completed ? "opacity-40" : ""}`}>
              {formatDeadline(task.deadline)}
              {isSoon && <span className="ml-2 text-white/40">• Soon</span>}
            </span>
          )}
        </div>

        {/* Action buttons: visible on mobile, hover-revealed on desktop */}
        {!isEditing && (
          <div className="flex items-center gap-0.5">
            {!task.completed && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditedTitle(task.title);
                  setIsEditing(true);
                }}
                className="p-1.5 text-[#555555] hover:text-[#999999] opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded"
                title="Edit task"
              >
                <Pencil size={13} />
              </button>
            )}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1.5 text-[#555555] hover:text-red-400 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded"
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="h-px bg-[#1A1A1A] mt-2 mb-1" />
    </div>
  );
}
