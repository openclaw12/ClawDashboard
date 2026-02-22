"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  Wifi,
  WifiOff,
  ChevronDown,
  Zap,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BotControlPanelProps {
  agentUrl: string;
}

interface BotTask {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

interface BotState {
  botStatus: string;
  currentTask: BotTask | null;
  taskQueue: BotTask[];
  completedTasks: BotTask[];
  logs: LogEntry[];
  startedAt: string | null;
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
    uptime: number;
  };
}

const defaultState: BotState = {
  botStatus: "stopped",
  currentTask: null,
  taskQueue: [],
  completedTasks: [],
  logs: [],
  startedAt: null,
  stats: { tasksCompleted: 0, tasksFailed: 0, uptime: 0 },
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const logIcons: Record<string, typeof Info> = {
  info: Info,
  warn: AlertCircle,
  error: XCircle,
  success: CheckCircle,
};

const logColors: Record<string, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  success: "text-green-400",
};

export default function BotControlPanel({ agentUrl }: BotControlPanelProps) {
  const [botState, setBotState] = useState<BotState>(defaultState);
  const [connected, setConnected] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "completed" | "logs">("queue");
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const wsUrl = agentUrl.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "state" && msg.data) {
          setBotState(msg.data);
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, 3000);
    };
    ws.onerror = () => setConnected(false);
    wsRef.current = ws;
  }, [agentUrl]);

  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, [connect]);

  const sendAction = (action: string, extra?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...extra }));
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    sendAction("addTask", { task: { title: newTaskTitle, description: newTaskDesc } });
    setNewTaskTitle("");
    setNewTaskDesc("");
    setShowAddTask(false);
  };

  const statusConfig: Record<string, { color: string; bg: string; icon: typeof Play; label: string }> = {
    stopped: { color: "text-slate-400", bg: "bg-slate-500/10", icon: Square, label: "Stopped" },
    running: { color: "text-green-400", bg: "bg-green-500/10", icon: Activity, label: "Running" },
    paused: { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Pause, label: "Paused" },
    error: { color: "text-red-400", bg: "bg-red-500/10", icon: AlertCircle, label: "Error" },
  };

  const currentConfig = statusConfig[botState.botStatus] || statusConfig.stopped;
  const StatusIcon = currentConfig.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Connection Banner */}
      {!connected && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <WifiOff className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">
            Not connected to agent. Run <code className="bg-[#0f172a] px-1.5 py-0.5 rounded text-xs">node agent/server.js</code>
          </span>
          <button onClick={connect} className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("p-1.5 rounded-lg", currentConfig.bg)}>
              <StatusIcon className={cn("w-4 h-4", currentConfig.color)} />
            </div>
            <span className="text-xs text-slate-400">Status</span>
          </div>
          <p className={cn("text-lg font-bold", currentConfig.color)}>{currentConfig.label}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10"><Clock className="w-4 h-4 text-blue-400" /></div>
            <span className="text-xs text-slate-400">Uptime</span>
          </div>
          <p className="text-lg font-bold text-white">{formatUptime(botState.stats.uptime)}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-500/10"><CheckCircle className="w-4 h-4 text-green-400" /></div>
            <span className="text-xs text-slate-400">Completed</span>
          </div>
          <p className="text-lg font-bold text-white">{botState.stats.tasksCompleted}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-500/10"><XCircle className="w-4 h-4 text-red-400" /></div>
            <span className="text-xs text-slate-400">Failed</span>
          </div>
          <p className="text-lg font-bold text-white">{botState.stats.tasksFailed}</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {botState.botStatus === "stopped" ? (
          <button
            onClick={() => sendAction("start")}
            disabled={!connected}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" /> Start Bot
          </button>
        ) : botState.botStatus === "running" ? (
          <>
            <button
              onClick={() => sendAction("pause")}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Pause className="w-4 h-4" /> Pause
            </button>
            <button
              onClick={() => sendAction("stop")}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </>
        ) : botState.botStatus === "paused" ? (
          <>
            <button
              onClick={() => sendAction("resume")}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" /> Resume
            </button>
            <button
              onClick={() => sendAction("stop")}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </>
        ) : null}

        <button
          onClick={() => setShowAddTask(!showAddTask)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4 animate-fade-in">
          <input
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 mb-2"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 h-16 resize-none mb-2"
          />
          <div className="flex gap-2">
            <button onClick={addTask} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              Add to Queue
            </button>
            <button onClick={() => setShowAddTask(false)} className="px-4 py-1.5 bg-[#334155] text-white text-sm rounded-lg hover:bg-[#475569] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Task */}
      {botState.currentTask && (
        <div className="bg-[#1e293b] rounded-xl border border-blue-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-xs font-medium text-blue-400 uppercase">Currently Running</span>
          </div>
          <p className="text-sm font-medium text-white">{botState.currentTask.title}</p>
          {botState.currentTask.description && (
            <p className="text-xs text-slate-400 mt-1">{botState.currentTask.description}</p>
          )}
          {botState.currentTask.startedAt && (
            <p className="text-xs text-slate-500 mt-2">
              Started: {new Date(botState.currentTask.startedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Tabs: Queue / Completed / Logs */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <div className="flex border-b border-[#334155]">
          {(["queue", "completed", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium transition-colors capitalize",
                activeTab === tab
                  ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab}
              {tab === "queue" && botState.taskQueue.length > 0 && (
                <span className="ml-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {botState.taskQueue.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {activeTab === "queue" && (
            botState.taskQueue.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Task queue is empty</p>
            ) : (
              <div className="space-y-2">
                {botState.taskQueue.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0f172a] border border-[#334155] group"
                  >
                    <Zap className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">Queued {new Date(task.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <button
                      onClick={() => sendAction("removeTask", { taskId: task.id })}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "completed" && (
            botState.completedTasks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No completed tasks yet</p>
            ) : (
              <div className="space-y-2">
                {botState.completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0f172a] border border-[#334155]"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {task.completedAt && new Date(task.completedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      task.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "logs" && (
            <>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => sendAction("clearLogs")}
                  className="text-xs text-slate-500 hover:text-white transition-colors"
                >
                  Clear logs
                </button>
              </div>
              {botState.logs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No logs yet</p>
              ) : (
                <div className="space-y-1 font-mono">
                  {botState.logs.map((log) => {
                    const Icon = logIcons[log.level] || Info;
                    return (
                      <div key={log.id} className="flex items-start gap-2 text-xs py-1">
                        <Icon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", logColors[log.level] || "text-slate-400")} />
                        <span className="text-slate-600 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    );
                  })}
                  <div ref={logsEndRef} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
