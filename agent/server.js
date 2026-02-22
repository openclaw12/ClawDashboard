#!/usr/bin/env node

/**
 * ClawBot Desktop Agent
 *
 * Local server that:
 * 1. Captures desktop screenshots and streams them via WebSocket
 * 2. Provides bot control API (start/stop, task queue, logs)
 * 3. Runs on localhost:9900
 *
 * Usage: node agent/server.js
 */

const http = require("http");
const { WebSocketServer } = require("ws");
const screenshot = require("screenshot-desktop");

const PORT = 9900;
const CAPTURE_INTERVAL_MS = 500; // ~2 FPS for smooth feel
const MAX_LOG_ENTRIES = 500;

// ─── Bot State ────────────────────────────────────────────────────────────────

const state = {
  botStatus: "stopped", // stopped | running | paused | error
  currentTask: null,
  taskQueue: [],
  completedTasks: [],
  logs: [],
  startedAt: null,
  stats: {
    tasksCompleted: 0,
    tasksFailed: 0,
    uptime: 0,
  },
};

function addLog(level, message) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    level, // info | warn | error | success
    message,
  };
  state.logs.unshift(entry);
  if (state.logs.length > MAX_LOG_ENTRIES) state.logs.length = MAX_LOG_ENTRIES;
  broadcastState();
  return entry;
}

function broadcastState() {
  const stateMsg = JSON.stringify({ type: "state", data: getPublicState() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(stateMsg);
  });
}

function getPublicState() {
  return {
    botStatus: state.botStatus,
    currentTask: state.currentTask,
    taskQueue: state.taskQueue,
    completedTasks: state.completedTasks.slice(0, 50),
    logs: state.logs.slice(0, 100),
    startedAt: state.startedAt,
    stats: {
      ...state.stats,
      uptime: state.startedAt
        ? Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000)
        : 0,
    },
  };
}

// ─── Desktop Capture ──────────────────────────────────────────────────────────

let captureInterval = null;
let lastFrameBase64 = null;

async function captureFrame() {
  try {
    const imgBuffer = await screenshot({ format: "jpg" });
    lastFrameBase64 = imgBuffer.toString("base64");
    // Send frame to all connected WebSocket clients
    const frameMsg = JSON.stringify({
      type: "frame",
      data: lastFrameBase64,
      timestamp: Date.now(),
    });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(frameMsg);
    });
  } catch (err) {
    // Silently handle capture errors (e.g., locked screen)
  }
}

function startCapture() {
  if (captureInterval) return;
  captureFrame(); // immediate first frame
  captureInterval = setInterval(captureFrame, CAPTURE_INTERVAL_MS);
}

function stopCapture() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
}

// ─── Bot Control ──────────────────────────────────────────────────────────────

function startBot() {
  if (state.botStatus === "running") return;
  state.botStatus = "running";
  state.startedAt = new Date().toISOString();
  addLog("success", "Bot started");
  processNextTask();
}

function stopBot() {
  state.botStatus = "stopped";
  state.currentTask = null;
  state.startedAt = null;
  addLog("info", "Bot stopped");
}

function pauseBot() {
  if (state.botStatus !== "running") return;
  state.botStatus = "paused";
  addLog("info", "Bot paused");
}

function resumeBot() {
  if (state.botStatus !== "paused") return;
  state.botStatus = "running";
  addLog("info", "Bot resumed");
  processNextTask();
}

function addTask(task) {
  const newTask = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: task.title || "Untitled Task",
    description: task.description || "",
    status: "queued",
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };
  state.taskQueue.push(newTask);
  addLog("info", `Task queued: ${newTask.title}`);
  if (state.botStatus === "running" && !state.currentTask) {
    processNextTask();
  }
  return newTask;
}

function removeTask(taskId) {
  const idx = state.taskQueue.findIndex((t) => t.id === taskId);
  if (idx !== -1) {
    const removed = state.taskQueue.splice(idx, 1)[0];
    addLog("info", `Task removed from queue: ${removed.title}`);
  }
  broadcastState();
}

function processNextTask() {
  if (state.botStatus !== "running") return;
  if (state.currentTask) return;
  if (state.taskQueue.length === 0) {
    addLog("info", "Task queue empty, waiting...");
    return;
  }
  const task = state.taskQueue.shift();
  task.status = "running";
  task.startedAt = new Date().toISOString();
  state.currentTask = task;
  addLog("info", `Started task: ${task.title}`);
  broadcastState();

  // Simulate task processing (replace with actual bot logic)
  // In a real integration, this is where ClawBot would execute the task
  const duration = 5000 + Math.random() * 15000;
  setTimeout(() => {
    if (state.currentTask && state.currentTask.id === task.id) {
      completeCurrentTask(Math.random() > 0.15); // 85% success rate sim
    }
  }, duration);
}

function completeCurrentTask(success) {
  if (!state.currentTask) return;
  const task = state.currentTask;
  task.status = success ? "completed" : "failed";
  task.completedAt = new Date().toISOString();
  state.completedTasks.unshift(task);
  if (state.completedTasks.length > 100) state.completedTasks.length = 100;

  if (success) {
    state.stats.tasksCompleted++;
    addLog("success", `Task completed: ${task.title}`);
  } else {
    state.stats.tasksFailed++;
    addLog("error", `Task failed: ${task.title}`);
  }

  state.currentTask = null;
  broadcastState();

  // Process next task
  if (state.botStatus === "running") {
    setTimeout(() => processNextTask(), 1000);
  }
}

// ─── HTTP Server (CORS-enabled REST API) ──────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Health check
  if (path === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", agent: "ClawBot Desktop Agent", version: "1.0.0" }));
    return;
  }

  // Get state
  if (path === "/state" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getPublicState()));
    return;
  }

  // Bot controls
  if (path === "/bot/start" && req.method === "POST") {
    startBot();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: state.botStatus }));
    return;
  }

  if (path === "/bot/stop" && req.method === "POST") {
    stopBot();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: state.botStatus }));
    return;
  }

  if (path === "/bot/pause" && req.method === "POST") {
    pauseBot();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: state.botStatus }));
    return;
  }

  if (path === "/bot/resume" && req.method === "POST") {
    resumeBot();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: state.botStatus }));
    return;
  }

  // Task management
  if (path === "/tasks" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const task = JSON.parse(body);
        const created = addTask(task);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(created));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (path.startsWith("/tasks/") && req.method === "DELETE") {
    const taskId = path.split("/tasks/")[1];
    removeTask(taskId);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Latest frame as JPEG (for non-WS clients)
  if (path === "/frame" && req.method === "GET") {
    if (lastFrameBase64) {
      const buf = Buffer.from(lastFrameBase64, "base64");
      res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-cache" });
      res.end(buf);
    } else {
      res.writeHead(204);
      res.end();
    }
    return;
  }

  // Clear logs
  if (path === "/logs/clear" && req.method === "POST") {
    state.logs = [];
    addLog("info", "Logs cleared");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// ─── WebSocket Server ─────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  addLog("info", "Dashboard client connected");

  // Send current state immediately
  ws.send(JSON.stringify({ type: "state", data: getPublicState() }));

  // Send latest frame if available
  if (lastFrameBase64) {
    ws.send(JSON.stringify({ type: "frame", data: lastFrameBase64, timestamp: Date.now() }));
  }

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      switch (msg.action) {
        case "start": startBot(); break;
        case "stop": stopBot(); break;
        case "pause": pauseBot(); break;
        case "resume": resumeBot(); break;
        case "addTask": addTask(msg.task || {}); break;
        case "removeTask": removeTask(msg.taskId); break;
        case "clearLogs":
          state.logs = [];
          addLog("info", "Logs cleared");
          break;
      }
    } catch {
      // Invalid message, ignore
    }
  });

  ws.on("close", () => {
    addLog("info", "Dashboard client disconnected");
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\n  🤖 ClawBot Desktop Agent running on http://localhost:${PORT}`);
  console.log(`  📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`  🖥️  Desktop capture: active\n`);
  console.log(`  Endpoints:`);
  console.log(`    GET  /health       - Health check`);
  console.log(`    GET  /state        - Current bot state`);
  console.log(`    GET  /frame        - Latest desktop screenshot (JPEG)`);
  console.log(`    POST /bot/start    - Start bot`);
  console.log(`    POST /bot/stop     - Stop bot`);
  console.log(`    POST /bot/pause    - Pause bot`);
  console.log(`    POST /bot/resume   - Resume bot`);
  console.log(`    POST /tasks        - Add task to queue`);
  console.log(`    DEL  /tasks/:id    - Remove task from queue`);
  console.log(`    POST /logs/clear   - Clear logs\n`);

  startCapture();
  addLog("info", "Desktop Agent initialized");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down agent...");
  stopCapture();
  wss.close();
  server.close();
  process.exit(0);
});
