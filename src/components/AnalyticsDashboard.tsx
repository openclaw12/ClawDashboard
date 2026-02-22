"use client";

import { ProductivityData, Task } from "@/lib/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Clock, Target, Zap } from "lucide-react";

interface AnalyticsDashboardProps {
  productivity: ProductivityData[];
  tasks: Task[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsDashboard({ productivity, tasks }: AnalyticsDashboardProps) {
  const totalTasksCompleted = productivity.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const totalHours = productivity.reduce((sum, d) => sum + d.hoursWorked, 0);
  const avgFocus = Math.round(productivity.reduce((sum, d) => sum + d.focusScore, 0) / productivity.length);
  const avgTasksPerDay = Math.round((totalTasksCompleted / productivity.length) * 10) / 10;

  const tasksByStatus = [
    { name: "To Do", value: tasks.filter((t) => t.status === "todo").length },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length },
    { name: "Done", value: tasks.filter((t) => t.status === "done").length },
  ];

  const tasksByPriority = [
    { name: "Urgent", value: tasks.filter((t) => t.priority === "urgent").length },
    { name: "High", value: tasks.filter((t) => t.priority === "high").length },
    { name: "Medium", value: tasks.filter((t) => t.priority === "medium").length },
    { name: "Low", value: tasks.filter((t) => t.priority === "low").length },
  ];

  const stats = [
    { label: "Tasks Completed", value: totalTasksCompleted, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Hours Tracked", value: `${Math.round(totalHours)}h`, icon: Clock, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Avg Focus Score", value: `${avgFocus}%`, icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Tasks/Day", value: avgTasksPerDay, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  const chartData = productivity.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Completed Over Time */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tasks Completed (14 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="dateLabel" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
              />
              <Bar dataKey="tasksCompleted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Focus Score Trend */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Focus Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="dateLabel" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
              />
              <Line type="monotone" dataKey="focusScore" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Status */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={tasksByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {tasksByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tasksByPriority} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={60} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {tasksByPriority.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hours Worked */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Hours Worked (14 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="dateLabel" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
            />
            <Line type="monotone" dataKey="hoursWorked" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
