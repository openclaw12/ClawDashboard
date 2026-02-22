"use client";

import { Bell, Search, User } from "lucide-react";
import { Notification } from "@/lib/types";

interface HeaderProps {
  title: string;
  notifications: Notification[];
  onNotificationClick: () => void;
}

export default function Header({ title, notifications, onNotificationClick }: HeaderProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 bg-[#1e293b] border-b border-[#334155] flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-[#0f172a] border border-[#334155] rounded-lg pl-10 pr-4 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>

        {/* Notifications */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 rounded-lg hover:bg-[#334155] transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
