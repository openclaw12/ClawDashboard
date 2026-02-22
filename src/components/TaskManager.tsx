"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Task } from "@/lib/types";
import { cn, getPriorityColor, getStatusColor } from "@/lib/utils";

interface TaskManagerProps {
  tasks: Task[];
  onUpdate: (tasks: Task[]) => void;
}

export default function TaskManager({ tasks, onUpdate }: TaskManagerProps) {
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    status: "todo" as Task["status"],
    dueDate: "",
    tags: "",
  });

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const resetForm = () => {
    setForm({ title: "", description: "", priority: "medium", status: "todo", dueDate: "", tags: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    if (editingId) {
      onUpdate(
        tasks.map((t) =>
          t.id === editingId
            ? { ...t, title: form.title, description: form.description, priority: form.priority, status: form.status, dueDate: form.dueDate || null, tags }
            : t
        )
      );
    } else {
      const newTask: Task = {
        id: uuidv4(),
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        createdAt: new Date().toISOString(),
        tags,
      };
      onUpdate([newTask, ...tasks]);
    }
    resetForm();
  };

  const startEdit = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate?.split("T")[0] ?? "",
      tags: task.tags.join(", "),
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const deleteTask = (id: string) => {
    onUpdate(tasks.filter((t) => t.id !== id));
  };

  const toggleStatus = (task: Task) => {
    const nextStatus: Record<Task["status"], Task["status"]> = {
      todo: "in-progress",
      "in-progress": "done",
      done: "todo",
    };
    onUpdate(tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus[t.status] } : t)));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {["all", "todo", "in-progress", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize",
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-[#1e293b] text-slate-400 hover:text-white border border-[#334155]"
              )}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-white mb-4">
            {editingId ? "Edit Task" : "New Task"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="col-span-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 h-20 resize-none"
            />
            <div className="relative">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CheckSquareIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#1e293b] rounded-xl border border-[#334155] p-4 card-hover animate-slide-in"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleStatus(task)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    task.status === "done"
                      ? "bg-green-500 border-green-500"
                      : task.status === "in-progress"
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-slate-500"
                  )}
                >
                  {task.status === "done" && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        task.status === "done" ? "text-slate-500 line-through" : "text-white"
                      )}
                    >
                      {task.title}
                    </span>
                    <span className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
                    <span className={cn("text-xs px-2 py-0.5 rounded-full text-white", getStatusColor(task.status))}>
                      {task.status.replace("-", " ")}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-400 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#0f172a] text-slate-400 border border-[#334155]"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.dueDate && (
                      <span className="text-xs text-slate-500 ml-auto">
                        Due: {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(task)}
                    className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
