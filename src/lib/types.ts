export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  createdAt: string;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  color: string;
  description: string;
}

export interface Message {
  id: string;
  sender: string;
  channel: string;
  content: string;
  timestamp: string;
  read: boolean;
  avatar: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  assignee: string;
  tags: string[];
  priority: "low" | "medium" | "high";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: string;
  read: boolean;
}

export interface ProductivityData {
  date: string;
  tasksCompleted: number;
  hoursWorked: number;
  focusScore: number;
}

export interface IntegrationConfig {
  name: string;
  enabled: boolean;
  apiKey: string;
  webhookUrl: string;
}
