"use client";

import {
  CheckSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Task, CalendarEvent, Message, ProductivityData } from "@/lib/types";
import { cn, formatRelativeTime, getPriorityColor } from "@/lib/utils";

interface DashboardOverviewProps {
  tasks: Task[];
  events: CalendarEvent[];
  messages: Message[];
  productivity: ProductivityData[];
}

export default function DashboardOverview({
  tasks,
  events,
  messages,
  productivity,
}: DashboardOverviewProps) {
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const urgentTasks = tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;
  const unreadMessages = messages.filter((m) => !m.read).length;
  const todayEvents = events.filter((e) => e.date === new Date().toISOString().split("T")[0]);
  const latestProductivity = productivity[productivity.length - 1];

  const stats = [
    { label: "Tasks Done", value: completedTasks, total: tasks.length, icon: CheckSquare, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "In Progress", value: inProgressTasks, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Urgent Items", value: urgentTasks, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Focus Score", value: latestProductivity?.focusScore ?? 0, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10", suffix: "%" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">{stat.label}</span>
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <Icon className={cn("w-4 h-4", stat.color)} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                {stat.total && (
                  <span className="text-sm text-slate-500">/ {stat.total}</span>
                )}
                {stat.suffix && (
                  <span className="text-sm text-slate-500">{stat.suffix}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Recent Tasks</h2>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0f172a] border border-[#334155]"
              >
                <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{task.status.replace("-", " ")}</p>
                </div>
                {task.dueDate && (
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">Today&apos;s Schedule</h2>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No events today</p>
          ) : (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0f172a] border border-[#334155]"
                >
                  <div
                    className="w-1 h-10 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {event.time} - {event.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <h2 className="text-base font-semibold text-white">
              Messages
              {unreadMessages > 0 && (
                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {unreadMessages} new
                </span>
              )}
            </h2>
          </div>
          <div className="space-y-3">
            {messages.slice(0, 4).map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg bg-[#0f172a] border border-[#334155]",
                  !msg.read && "border-l-2 border-l-blue-500"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {msg.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{msg.sender}</span>
                    <span className="text-xs text-slate-600">{msg.channel}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{msg.content}</p>
                </div>
                <span className="text-xs text-slate-600 whitespace-nowrap">
                  {formatRelativeTime(msg.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Summary */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-semibold text-white">Productivity</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {productivity.slice(-7).map((day) => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-slate-500 mb-1">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="w-full bg-[#0f172a] rounded-full h-2 mb-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${day.focusScore}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400">{day.tasksCompleted} tasks</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
