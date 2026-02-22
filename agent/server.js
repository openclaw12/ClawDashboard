#!/usr/bin/env node

/**
 * ClawBot Desktop Agent
 *
 * Runs on the machine with the desktop you want to monitor (e.g. Raspberry Pi).
 * Captures desktop screenshots and streams them via WebSocket.
 * Provides bot control API (start/stop, task queue, logs).
 *
 * Works on: Linux (Raspberry Pi), Windows, macOS
 *
 * Usage:
 *   node agent/server.js
 *   node agent/server.js --port 9900
 *
 * Then expose via Cloudflare Tunnel for remote access:
 *   cloudflared tunnel --url http://localhost:9900
 */

const http = require("http");
const { WebSocketServer } = require("ws");
const { execSync, exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] || "9900", 10);
const CAPTURE_INTERVAL_MS = parseInt(process.env.CAPTURE_INTERVAL || "800", 10);
const MAX_LOG_ENTRIES = 500;

// ─── Platform Detection ──────────────────────────────────────────────────────

const platform = os.platform();

function detectCaptureMethod() {
  if (platform === "win32") {
    // Windows: use screenshot-desktop (already works)
    try {
      require.resolve("screenshot-desktop");
      return "screenshot-desktop";
    } catch {
      return "none";
    }
  }

  if (platform === "linux") {
    // Linux/Pi: try scrot, then import (ImageMagick), then fbgrab
    try {
      execSync("which scrot", { stdio: "ignore" });
      return "scrot";
    } catch {}
    try {
      execSync("which import", { stdio: "ignore" });
      return "import";
    } catch {}
    try {
      execSync("which fbgrab", { stdio: "ignore" });
      return "fbgrab";
    } catch {}
    try {
      require.resolve("screenshot-desktop");
      return "screenshot-desktop";
    } catch {}
    return "none";
  }

  if (platform === "darwin") {
    return "screencapture";
  }

  return "none";
}

const captureMethod = detectCaptureMethod();
const tmpFile = path.join(os.tmpdir(), "clawbot-frame.jpg");

console.log(`  Platform: ${platform}, Capture method: ${captureMethod}`);

// ─── Bot State ────────────────────────────────────────────────────────────────

const state = {
  botStatus: "stopped",
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
    level,
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
    platform,
    captureMethod,
    hostname: os.hostname(),
  };
}

// ─── Desktop Capture ──────────────────────────────────────────────────────────

let captureInterval = null;
let lastFrameBase64 = null;
let captureInProgress = false;

async function captureWithScreenshotDesktop() {
  const screenshot = require("screenshot-desktop");
  const imgBuffer = await screenshot({ format: "jpg" });
  return imgBuffer.toString("base64");
}

function captureWithScrot() {
  return new Promise((resolve, reject) => {
    exec(`scrot -q 60 -o ${tmpFile}`, { timeout: 5000 }, (err) => {
      if (err) return reject(err);
      try {
        const buf = fs.readFileSync(tmpFile);
        resolve(buf.toString("base64"));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function captureWithImport() {
  return new Promise((resolve, reject) => {
    exec(`import -window root -quality 60 ${tmpFile}`, { timeout: 5000 }, (err) => {
      if (err) return reject(err);
      try {
        const buf = fs.readFileSync(tmpFile);
        resolve(buf.toString("base64"));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function captureWithFbgrab() {
  return new Promise((resolve, reject) => {
    exec(`fbgrab ${tmpFile}`, { timeout: 5000 }, (err) => {
      if (err) return reject(err);
      try {
        const buf = fs.readFileSync(tmpFile);
        resolve(buf.toString("base64"));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function captureWithScreencapture() {
  return new Promise((resolve, reject) => {
    exec(`screencapture -x -t jpg ${tmpFile}`, { timeout: 5000 }, (err) => {
      if (err) return reject(err);
      try {
        const buf = fs.readFileSync(tmpFile);
        resolve(buf.toString("base64"));
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function captureFrame() {
  if (captureInProgress) return;
  captureInProgress = true;
  try {
    let base64;
    switch (captureMethod) {
      case "screenshot-desktop":
        base64 = await captureWithScreenshotDesktop();
        break;
      case "scrot":
        base64 = await captureWithScrot();
        break;
      case "import":
        base64 = await captureWithImport();
        break;
      case "fbgrab":
        base64 = await captureWithFbgrab();
        break;
      case "screencapture":
        base64 = await captureWithScreencapture();
        break;
      default:
        return;
    }

    lastFrameBase64 = base64;
    const frameMsg = JSON.stringify({
      type: "frame",
      data: lastFrameBase64,
      timestamp: Date.now(),
    });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(frameMsg);
    });
  } catch (err) {
    // Silently handle capture errors
  } finally {
    captureInProgress = false;
  }
}

function startCapture() {
  if (captureMethod === "none") {
    console.log("  ⚠️  No screenshot tool found. Install scrot: sudo apt install scrot");
    return;
  }
  if (captureInterval) return;
  captureFrame();
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
  const duration = 5000 + Math.random() * 15000;
  setTimeout(() => {
    if (state.currentTask && state.currentTask.id === task.id) {
      completeCurrentTask(Math.random() > 0.15);
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

  if (state.botStatus === "running") {
    setTimeout(() => processNextTask(), 1000);
  }
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  if (p === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", agent: "ClawBot Desktop Agent", version: "1.1.0", platform, captureMethod, hostname: os.hostname() }));
    return;
  }

  if (p === "/state" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getPublicState()));
    return;
  }

  if (p === "/bot/start" && req.method === "POST") { startBot(); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, status: state.botStatus })); return; }
  if (p === "/bot/stop" && req.method === "POST") { stopBot(); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, status: state.botStatus })); return; }
  if (p === "/bot/pause" && req.method === "POST") { pauseBot(); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, status: state.botStatus })); return; }
  if (p === "/bot/resume" && req.method === "POST") { resumeBot(); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, status: state.botStatus })); return; }

  if (p === "/tasks" && req.method === "POST") {
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

  if (p.startsWith("/tasks/") && req.method === "DELETE") {
    removeTask(p.split("/tasks/")[1]);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (p === "/frame" && req.method === "GET") {
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

  if (p === "/logs/clear" && req.method === "POST") {
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
  ws.send(JSON.stringify({ type: "state", data: getPublicState() }));
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
        case "clearLogs": state.logs = []; addLog("info", "Logs cleared"); break;
      }
    } catch { /* ignore */ }
  });

  ws.on("close", () => addLog("info", "Dashboard client disconnected"));
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  ClawBot Desktop Agent v1.1.0`);
  console.log(`  ────────────────────────────`);
  console.log(`  HTTP:      http://0.0.0.0:${PORT}`);
  console.log(`  WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`  Platform:  ${platform} (${os.hostname()})`);
  console.log(`  Capture:   ${captureMethod}`);
  console.log(`  Interval:  ${CAPTURE_INTERVAL_MS}ms\n`);
  console.log(`  To expose remotely via Cloudflare Tunnel:`);
  console.log(`    cloudflared tunnel --url http://localhost:${PORT}\n`);

  startCapture();
  addLog("info", `Desktop Agent initialized on ${os.hostname()} (${platform})`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down agent...");
  stopCapture();
  try { fs.unlinkSync(tmpFile); } catch {}
  wss.close();
  server.close();
  process.exit(0);
});
