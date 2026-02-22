"use client";

import { Check, Info, AlertTriangle, CheckCircle, XCircle, Trash2, BellOff } from "lucide-react";
import { Notification } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface NotificationsPanelProps {
  notifications: Notification[];
  onUpdate: (notifications: Notification[]) => void;
}

const typeConfig: Record<Notification["type"], { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export default function NotificationsPanel({ notifications, onUpdate }: NotificationsPanelProps) {
  const markAsRead = (id: string) => {
    onUpdate(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    onUpdate(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    onUpdate(notifications.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    onUpdate([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#1e293b] border border-[#334155] rounded-lg hover:bg-[#334155] transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 bg-[#1e293b] border border-[#334155] rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer group card-hover",
                  !notif.read
                    ? "bg-[#1e293b] border-blue-500/30"
                    : "bg-[#1e293b] border-[#334155]"
                )}
              >
                <div className={cn("p-2 rounded-lg flex-shrink-0", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{notif.title}</span>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 pulse-dot" />}
                  </div>
                  <p className="text-sm text-slate-400">{notif.message}</p>
                  <span className="text-xs text-slate-600 mt-1 inline-block">
                    {formatRelativeTime(notif.timestamp)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
