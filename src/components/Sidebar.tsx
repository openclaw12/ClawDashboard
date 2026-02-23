"use client";

import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  Kanban,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cog,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  notificationCount: number;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "desktop", label: "Live Desktop", icon: Monitor },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "projects", label: "Projects", icon: Kanban },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapse,
  notificationCount,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-[#1e293b] border-r border-[#334155] flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-[#334155]">
        <div className="flex items-center gap-2">
          <Cog className="w-7 h-7 text-blue-500 flex-shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold text-white whitespace-nowrap">
              ClawDash
            </span>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#334155]"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {item.id === "notifications" && notificationCount > 0 && (
                <span
                  className={cn(
                    "bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center",
                    collapsed
                      ? "absolute top-0.5 right-0.5 w-4 h-4"
                      : "ml-auto w-5 h-5"
                  )}
                >
                  {notificationCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center h-10 border-t border-[#334155] text-slate-400 hover:text-white transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
