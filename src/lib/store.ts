"use client";

import { v4 as uuidv4 } from "uuid";
import {
  Task,
  CalendarEvent,
  Message,
  KanbanColumn,
  Notification,
  ProductivityData,
  IntegrationConfig,
} from "./types";

const STORAGE_KEYS = {
  tasks: "claw_tasks",
  events: "claw_events",
  messages: "claw_messages",
  kanban: "claw_kanban",
  notifications: "claw_notifications",
  productivity: "claw_productivity",
  integrations: "claw_integrations",
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

// Default data generators
export function getDefaultTasks(): Task[] {
  return loadFromStorage<Task[]>(STORAGE_KEYS.tasks, [
    {
      id: uuidv4(),
      title: "Set up project infrastructure",
      description: "Initialize the ClawDashboard project with Next.js and deploy",
      status: "done",
      priority: "high",
      dueDate: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      tags: ["setup", "infrastructure"],
    },
    {
      id: uuidv4(),
      title: "Configure API integrations",
      description: "Set up connections to Slack, Google Calendar, and Jira",
      status: "in-progress",
      priority: "high",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      tags: ["api", "integrations"],
    },
    {
      id: uuidv4(),
      title: "Design analytics dashboard",
      description: "Create wireframes for the productivity analytics view",
      status: "todo",
      priority: "medium",
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      createdAt: new Date().toISOString(),
      tags: ["design", "analytics"],
    },
    {
      id: uuidv4(),
      title: "Write unit tests",
      description: "Add test coverage for core components",
      status: "todo",
      priority: "low",
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      createdAt: new Date().toISOString(),
      tags: ["testing"],
    },
    {
      id: uuidv4(),
      title: "Security audit",
      description: "Review all API endpoints and data handling for vulnerabilities",
      status: "todo",
      priority: "urgent",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      tags: ["security"],
    },
  ]);
}

export function getDefaultEvents(): CalendarEvent[] {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today.getTime() + 86400000).toISOString().split("T")[0];
  return loadFromStorage<CalendarEvent[]>(STORAGE_KEYS.events, [
    { id: uuidv4(), title: "Team Standup", date: todayStr, time: "09:00", endTime: "09:30", color: "#3b82f6", description: "Daily sync" },
    { id: uuidv4(), title: "Sprint Planning", date: todayStr, time: "14:00", endTime: "15:30", color: "#8b5cf6", description: "Plan next sprint" },
    { id: uuidv4(), title: "1:1 with Manager", date: tomorrow, time: "10:00", endTime: "10:30", color: "#10b981", description: "Weekly check-in" },
    { id: uuidv4(), title: "Code Review Session", date: tomorrow, time: "13:00", endTime: "14:00", color: "#f59e0b", description: "Review PRs" },
  ]);
}

export function getDefaultMessages(): Message[] {
  return loadFromStorage<Message[]>(STORAGE_KEYS.messages, [
    { id: uuidv4(), sender: "Alice Chen", channel: "#general", content: "Hey team! The new dashboard looks amazing 🎉", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false, avatar: "AC" },
    { id: uuidv4(), sender: "Bob Smith", channel: "#engineering", content: "Deployed v2.1 to staging. Please test when you get a chance.", timestamp: new Date(Date.now() - 7200000).toISOString(), read: false, avatar: "BS" },
    { id: uuidv4(), sender: "Carol Davis", channel: "#design", content: "Updated the mockups for the analytics page. Link in the thread.", timestamp: new Date(Date.now() - 10800000).toISOString(), read: true, avatar: "CD" },
    { id: uuidv4(), sender: "David Lee", channel: "DM", content: "Can we sync on the API integration tomorrow?", timestamp: new Date(Date.now() - 14400000).toISOString(), read: false, avatar: "DL" },
    { id: uuidv4(), sender: "Eve Wilson", channel: "#general", content: "Reminder: All-hands meeting at 3pm today", timestamp: new Date(Date.now() - 18000000).toISOString(), read: true, avatar: "EW" },
  ]);
}

export function getDefaultKanban(): KanbanColumn[] {
  return loadFromStorage<KanbanColumn[]>(STORAGE_KEYS.kanban, [
    {
      id: "backlog",
      title: "Backlog",
      cards: [
        { id: uuidv4(), title: "User authentication flow", description: "Implement OAuth2 login", assignee: "Alice", tags: ["auth", "backend"], priority: "high" },
        { id: uuidv4(), title: "Mobile responsive design", description: "Optimize for mobile devices", assignee: "Carol", tags: ["design", "frontend"], priority: "medium" },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      cards: [
        { id: uuidv4(), title: "API rate limiting", description: "Add rate limiting to all endpoints", assignee: "Bob", tags: ["backend", "security"], priority: "high" },
      ],
    },
    {
      id: "review",
      title: "In Review",
      cards: [
        { id: uuidv4(), title: "Dashboard widgets", description: "Customizable widget system", assignee: "David", tags: ["frontend"], priority: "medium" },
      ],
    },
    {
      id: "done",
      title: "Done",
      cards: [
        { id: uuidv4(), title: "Project setup", description: "Initialize repo and CI/CD", assignee: "Eve", tags: ["devops"], priority: "low" },
      ],
    },
  ]);
}

export function getDefaultNotifications(): Notification[] {
  return loadFromStorage<Notification[]>(STORAGE_KEYS.notifications, [
    { id: uuidv4(), title: "Task Due Soon", message: "Security audit is due tomorrow", type: "warning", timestamp: new Date().toISOString(), read: false },
    { id: uuidv4(), title: "Deployment Success", message: "v2.1 deployed to staging", type: "success", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
    { id: uuidv4(), title: "New Message", message: "Alice Chen mentioned you in #general", type: "info", timestamp: new Date(Date.now() - 7200000).toISOString(), read: true },
  ]);
}

export function getDefaultProductivity(): ProductivityData[] {
  const data: ProductivityData[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    data.push({
      date: date.toISOString().split("T")[0],
      tasksCompleted: Math.floor(Math.random() * 8) + 1,
      hoursWorked: Math.round((Math.random() * 4 + 5) * 10) / 10,
      focusScore: Math.floor(Math.random() * 30) + 60,
    });
  }
  return loadFromStorage<ProductivityData[]>(STORAGE_KEYS.productivity, data);
}

export function getDefaultIntegrations(): IntegrationConfig[] {
  return loadFromStorage<IntegrationConfig[]>(STORAGE_KEYS.integrations, [
    { name: "Slack", enabled: false, apiKey: "", webhookUrl: "" },
    { name: "Google Calendar", enabled: false, apiKey: "", webhookUrl: "" },
    { name: "Jira", enabled: false, apiKey: "", webhookUrl: "" },
    { name: "Trello", enabled: false, apiKey: "", webhookUrl: "" },
    { name: "GitHub", enabled: false, apiKey: "", webhookUrl: "" },
  ]);
}

// Persistence helpers
export const saveTasks = (tasks: Task[]) => saveToStorage(STORAGE_KEYS.tasks, tasks);
export const saveEvents = (events: CalendarEvent[]) => saveToStorage(STORAGE_KEYS.events, events);
export const saveMessages = (messages: Message[]) => saveToStorage(STORAGE_KEYS.messages, messages);
export const saveKanban = (columns: KanbanColumn[]) => saveToStorage(STORAGE_KEYS.kanban, columns);
export const saveNotifications = (notifs: Notification[]) => saveToStorage(STORAGE_KEYS.notifications, notifs);
export const saveProductivity = (data: ProductivityData[]) => saveToStorage(STORAGE_KEYS.productivity, data);
export const saveIntegrations = (configs: IntegrationConfig[]) => saveToStorage(STORAGE_KEYS.integrations, configs);
