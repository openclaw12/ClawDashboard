"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Monitor,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
  Camera,
  ZoomIn,
  ZoomOut,
  Loader2,
  Play,
  Square,
  Pause,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  Activity,
  Zap,
  ChevronUp,
  ChevronDown,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveDesktopViewProps {
  agentUrl: string;
  onAgentUrlUpdate?: (url: string) => void;
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
  stats: { tasksCompleted: number; tasksFailed: number; uptime: number };
  hostname?: string;
  platform?: string;
  captureMethod?: string;
}

const defaultBotState: BotState = {
  botStatus: "stopped",
  currentTask: null,
  taskQueue: [],
  completedTasks: [],
  logs: [],
  startedAt: null,
  stats: { tasksCompleted: 0, tasksFailed: 0, uptime: 0 },
};

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

const logIcons: Record<string, typeof Info> = { info: Info, warn: AlertCircle, error: XCircle, success: CheckCircle };
const logColors: Record<string, string> = { info: "text-blue-400", warn: "text-yellow-400", error: "text-red-400", success: "text-green-400" };

export default function LiveDesktopView({ agentUrl, onAgentUrlUpdate }: LiveDesktopViewProps) {
  // Connection state
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [urlInput, setUrlInput] = useState(agentUrl);
  const [errorMsg, setErrorMsg] = useState("");

  // Desktop stream
  const [frame, setFrame] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const frameCountRef = useRef(0);

  // Bot state
  const [botState, setBotState] = useState<BotState>(defaultBotState);
  const [showPanel, setShowPanel] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [panelTab, setPanelTab] = useState<"controls" | "logs">("controls");

  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  // Try to auto-connect if URL is saved and not the default localhost
  useEffect(() => {
    if (agentUrl && agentUrl !== "ws://localhost:9900") {
      handleConnect(agentUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback((url?: string) => {
    const connectUrl = url || urlInput.trim();
    if (!connectUrl) return;

    // Normalize URL
    let wsUrl = connectUrl;
    if (wsUrl.startsWith("https://")) wsUrl = wsUrl.replace("https://", "wss://");
    else if (wsUrl.startsWith("http://")) wsUrl = wsUrl.replace("http://", "ws://");
    else if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) wsUrl = `wss://${wsUrl}`;
    wsUrl = wsUrl.replace(/\/$/, "");

    setUrlInput(wsUrl);
    setConnectionState("connecting");
    setErrorMsg("");

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    if (reconnectRef.current) clearTimeout(reconnectRef.current);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionState("connected");
      setErrorMsg("");
      // Save the URL so it auto-connects next time
      if (onAgentUrlUpdate) onAgentUrlUpdate(wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "frame" && msg.data) {
          setFrame(msg.data);
          frameCountRef.current++;
        }
        if (msg.type === "state" && msg.data) {
          setBotState(msg.data);
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConnectionState("disconnected");
      setFrame(null);
      // Auto-reconnect if was previously connected
      reconnectRef.current = setTimeout(() => {
        if (wsUrl && onAgentUrlUpdate) handleConnect(wsUrl);
      }, 5000);
    };

    ws.onerror = () => {
      setConnectionState("disconnected");
      setErrorMsg("Could not connect. Make sure the agent is running on your Pi.");
    };

    wsRef.current = ws;
  }, [urlInput, onAgentUrlUpdate]);

  const disconnect = () => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    setConnectionState("disconnected");
    setFrame(null);
    setBotState(defaultBotState);
  };

  const sendAction = (action: string, extra?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...extra }));
    }
  };

  // FPS counter
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);
    return () => {
      clearInterval(interval);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!fullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ─── DISCONNECTED: Show Connect Screen ──────────────────────────────────────
  if (connectionState === "disconnected") {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect to OpenClaw</h2>
            <p className="text-sm text-slate-400">
              Enter your Pi&apos;s tunnel URL to see its desktop and control the bot remotely.
            </p>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Agent URL</label>
              <input
                type="text"
                placeholder="https://your-tunnel.trycloudflare.com"
                value={urlInput === "ws://localhost:9900" ? "" : urlInput.replace(/^wss?:\/\//, "https://")}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{errorMsg}</span>
              </div>
            )}

            <button
              onClick={() => handleConnect()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Wifi className="w-5 h-5" />
              Connect
            </button>

            <div className="border-t border-[#334155] pt-4">
              <p className="text-xs font-medium text-slate-300 mb-2">First time? Run this on your Raspberry Pi:</p>
              <div className="bg-[#0f172a] rounded-lg p-3 border border-[#334155]">
                <code className="text-xs text-green-400 block whitespace-pre-wrap">
{`git clone https://github.com/openclaw12/ClawDashboard.git
cd ClawDashboard
chmod +x agent/setup-pi.sh
./agent/setup-pi.sh`}
                </code>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This installs everything and auto-starts on boot. It will print a URL - paste that above.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CONNECTING: Show loading ───────────────────────────────────────────────
  if (connectionState === "connecting") {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Connecting to OpenClaw...</h2>
          <p className="text-sm text-slate-400">{urlInput}</p>
          <button onClick={disconnect} className="mt-4 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── CONNECTED: Show Desktop + Controls ─────────────────────────────────────
  const statusColors: Record<string, string> = {
    stopped: "text-slate-400",
    running: "text-green-400",
    paused: "text-yellow-400",
    error: "text-red-400",
  };

  return (
    <div ref={containerRef} className="animate-fade-in space-y-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-[#1e293b] rounded-t-xl border border-[#334155] px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
          {botState.hostname && (
            <span className="text-xs text-slate-500">{botState.hostname}</span>
          )}
          <span className="text-xs text-slate-600">{fps} FPS</span>
          <span className={cn("text-xs font-medium capitalize", statusColors[botState.botStatus])}>
            Bot: {botState.botStatus}
          </span>
          {botState.stats.uptime > 0 && (
            <span className="text-xs text-slate-500">Up: {formatUptime(botState.stats.uptime)}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Bot Controls inline */}
          {botState.botStatus === "stopped" ? (
            <button onClick={() => sendAction("start")} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors" title="Start Bot">
              <Play className="w-4 h-4" />
            </button>
          ) : botState.botStatus === "running" ? (
            <>
              <button onClick={() => sendAction("pause")} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors" title="Pause Bot">
                <Pause className="w-4 h-4" />
              </button>
              <button onClick={() => sendAction("stop")} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Stop Bot">
                <Square className="w-4 h-4" />
              </button>
            </>
          ) : botState.botStatus === "paused" ? (
            <>
              <button onClick={() => sendAction("resume")} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors" title="Resume">
                <Play className="w-4 h-4" />
              </button>
              <button onClick={() => sendAction("stop")} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Stop">
                <Square className="w-4 h-4" />
              </button>
            </>
          ) : null}

          <div className="w-px h-4 bg-[#334155] mx-1" />

          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))} className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => { if (frame) { const a = document.createElement("a"); a.href = `data:image/jpeg;base64,${frame}`; a.download = `openclaw-${Date.now()}.jpg`; a.click(); }}} className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors" title="Screenshot">
            <Camera className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors" title="Fullscreen">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowPanel(!showPanel)} className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors" title="Toggle panel">
            <Terminal className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#334155] mx-1" />

          <button onClick={disconnect} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Disconnect">
            <WifiOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex">
        {/* Desktop Frame */}
        <div className={cn(
          "bg-black border-x border-b border-[#334155] overflow-hidden flex items-center justify-center",
          fullscreen ? "h-screen w-full" : "h-[calc(100vh-11rem)]",
          showPanel && !fullscreen ? "flex-1" : "w-full",
          !fullscreen && "rounded-bl-xl",
          !showPanel && !fullscreen && "rounded-br-xl"
        )}>
          {frame ? (
            <img
              src={`data:image/jpeg;base64,${frame}`}
              alt="OpenClaw Desktop"
              className="max-w-full max-h-full object-contain transition-transform"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          ) : (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-600">Waiting for frames...</p>
            </div>
          )}
        </div>

        {/* Side Panel */}
        {showPanel && !fullscreen && (
          <div className="w-80 flex-shrink-0 bg-[#1e293b] border-r border-b border-[#334155] rounded-br-xl flex flex-col h-[calc(100vh-11rem)] overflow-hidden">
            {/* Panel Tabs */}
            <div className="flex border-b border-[#334155]">
              <button onClick={() => setPanelTab("controls")} className={cn("flex-1 px-3 py-2 text-xs font-medium", panelTab === "controls" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white")}>
                Controls
              </button>
              <button onClick={() => setPanelTab("logs")} className={cn("flex-1 px-3 py-2 text-xs font-medium", panelTab === "logs" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white")}>
                Logs ({botState.logs.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {panelTab === "controls" ? (
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0f172a] rounded-lg p-2.5 border border-[#334155]">
                      <p className="text-xs text-slate-500">Completed</p>
                      <p className="text-lg font-bold text-white">{botState.stats.tasksCompleted}</p>
                    </div>
                    <div className="bg-[#0f172a] rounded-lg p-2.5 border border-[#334155]">
                      <p className="text-xs text-slate-500">Failed</p>
                      <p className="text-lg font-bold text-white">{botState.stats.tasksFailed}</p>
                    </div>
                  </div>

                  {/* Current Task */}
                  {botState.currentTask && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                        <span className="text-xs text-blue-400 font-medium">Running</span>
                      </div>
                      <p className="text-sm text-white">{botState.currentTask.title}</p>
                    </div>
                  )}

                  {/* Add Task */}
                  <button
                    onClick={() => setShowAddTask(!showAddTask)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>

                  {showAddTask && (
                    <div className="bg-[#0f172a] rounded-lg p-3 border border-[#334155] space-y-2 animate-fade-in">
                      <input
                        type="text"
                        placeholder="Task name..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && newTaskTitle.trim()) { sendAction("addTask", { task: { title: newTaskTitle } }); setNewTaskTitle(""); setShowAddTask(false); }}}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => { if (newTaskTitle.trim()) { sendAction("addTask", { task: { title: newTaskTitle } }); setNewTaskTitle(""); setShowAddTask(false); }}}
                        className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        Queue Task
                      </button>
                    </div>
                  )}

                  {/* Task Queue */}
                  {botState.taskQueue.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Queue ({botState.taskQueue.length})</p>
                      <div className="space-y-1">
                        {botState.taskQueue.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-[#0f172a] border border-[#334155] group">
                            <Zap className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="text-xs text-white flex-1 truncate">{task.title}</span>
                            <button onClick={() => sendAction("removeTask", { taskId: task.id })} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Completed */}
                  {botState.completedTasks.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Recent</p>
                      <div className="space-y-1">
                        {botState.completedTasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-[#0f172a] border border-[#334155]">
                            {task.status === "completed" ? (
                              <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                            )}
                            <span className="text-xs text-slate-300 flex-1 truncate">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Logs */
                <div className="space-y-0.5 font-mono">
                  {botState.logs.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">No logs yet</p>
                  ) : (
                    botState.logs.map((log) => {
                      const Icon = logIcons[log.level] || Info;
                      return (
                        <div key={log.id} className="flex items-start gap-1.5 text-xs py-0.5">
                          <Icon className={cn("w-3 h-3 mt-0.5 flex-shrink-0", logColors[log.level])} />
                          <span className="text-slate-600 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
