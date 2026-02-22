"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardOverview from "@/components/DashboardOverview";
import TaskManager from "@/components/TaskManager";
import CalendarView from "@/components/CalendarView";
import CommunicationHub from "@/components/CommunicationHub";
import ProjectBoard from "@/components/ProjectBoard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import NotificationsPanel from "@/components/NotificationsPanel";
import SettingsPanel from "@/components/SettingsPanel";
import {
  getDefaultTasks,
  getDefaultEvents,
  getDefaultMessages,
  getDefaultKanban,
  getDefaultNotifications,
  getDefaultProductivity,
  getDefaultIntegrations,
  saveTasks,
  saveEvents,
  saveMessages,
  saveKanban,
  saveNotifications,
  saveIntegrations,
} from "@/lib/store";
import {
  Task,
  CalendarEvent,
  Message,
  KanbanColumn,
  Notification,
  ProductivityData,
  IntegrationConfig,
} from "@/lib/types";

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "Task Manager",
  calendar: "Calendar",
  messages: "Communications",
  projects: "Project Board",
  analytics: "Analytics",
  notifications: "Notifications",
  settings: "Settings",
};

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [kanban, setKanban] = useState<KanbanColumn[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [productivity, setProductivity] = useState<ProductivityData[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);

  useEffect(() => {
    setTasks(getDefaultTasks());
    setEvents(getDefaultEvents());
    setMessages(getDefaultMessages());
    setKanban(getDefaultKanban());
    setNotifications(getDefaultNotifications());
    setProductivity(getDefaultProductivity());
    setIntegrations(getDefaultIntegrations());
    setMounted(true);
  }, []);

  const handleTasksUpdate = useCallback((updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  }, []);

  const handleEventsUpdate = useCallback((updated: CalendarEvent[]) => {
    setEvents(updated);
    saveEvents(updated);
  }, []);

  const handleMessagesUpdate = useCallback((updated: Message[]) => {
    setMessages(updated);
    saveMessages(updated);
  }, []);

  const handleKanbanUpdate = useCallback((updated: KanbanColumn[]) => {
    setKanban(updated);
    saveKanban(updated);
  }, []);

  const handleNotificationsUpdate = useCallback((updated: Notification[]) => {
    setNotifications(updated);
    saveNotifications(updated);
  }, []);

  const handleIntegrationsUpdate = useCallback((updated: IntegrationConfig[]) => {
    setIntegrations(updated);
    saveIntegrations(updated);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading ClawDashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        notificationCount={unreadNotifications}
      />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "4rem" : "14rem" }}
      >
        <Header
          title={viewTitles[activeView] ?? "Dashboard"}
          notifications={notifications}
          onNotificationClick={() => setActiveView("notifications")}
        />
        <main className="p-6">
          {activeView === "dashboard" && (
            <DashboardOverview
              tasks={tasks}
              events={events}
              messages={messages}
              productivity={productivity}
            />
          )}
          {activeView === "tasks" && (
            <TaskManager tasks={tasks} onUpdate={handleTasksUpdate} />
          )}
          {activeView === "calendar" && (
            <CalendarView events={events} onUpdate={handleEventsUpdate} />
          )}
          {activeView === "messages" && (
            <CommunicationHub messages={messages} onUpdate={handleMessagesUpdate} />
          )}
          {activeView === "projects" && (
            <ProjectBoard columns={kanban} onUpdate={handleKanbanUpdate} />
          )}
          {activeView === "analytics" && (
            <AnalyticsDashboard productivity={productivity} tasks={tasks} />
          )}
          {activeView === "notifications" && (
            <NotificationsPanel
              notifications={notifications}
              onUpdate={handleNotificationsUpdate}
            />
          )}
          {activeView === "settings" && (
            <SettingsPanel
              integrations={integrations}
              onUpdate={handleIntegrationsUpdate}
            />
          )}
        </main>
      </div>
    </div>
  );
}
