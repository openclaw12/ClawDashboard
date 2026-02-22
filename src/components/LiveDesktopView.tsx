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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveDesktopViewProps {
  agentUrl: string;
}

export default function LiveDesktopView({ agentUrl }: LiveDesktopViewProps) {
  const [connected, setConnected] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const frameCountRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = agentUrl.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "frame" && msg.data) {
          setFrame(msg.data);
          frameCountRef.current++;
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setFrame(null);
      // Auto-reconnect after 3s
      setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    wsRef.current = ws;
  }, [agentUrl]);

  useEffect(() => {
    connect();

    // FPS counter
    const fpsInterval = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(fpsInterval);
      wsRef.current?.close();
    };
  }, [connect]);

  const toggleFullscreen = () => {
    if (!fullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div ref={containerRef} className="space-y-3 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-[#1e293b] rounded-xl border border-[#334155] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Monitor className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-white">Live Desktop</span>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400">Connected</span>
                <span className="text-xs text-slate-500 ml-2">{fps} FPS</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              wsRef.current?.close();
              setTimeout(connect, 100);
            }}
            className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
            title="Reconnect"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (frame) {
                const link = document.createElement("a");
                link.href = `data:image/jpeg;base64,${frame}`;
                link.download = `clawbot-screenshot-${Date.now()}.jpg`;
                link.click();
              }
            }}
            className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
            title="Save screenshot"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Frame */}
      <div
        className={cn(
          "bg-black rounded-xl border border-[#334155] overflow-hidden flex items-center justify-center",
          fullscreen ? "h-screen" : "h-[calc(100vh-16rem)]"
        )}
      >
        {frame ? (
          <img
            src={`data:image/jpeg;base64,${frame}`}
            alt="Live Desktop"
            className="max-w-full max-h-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        ) : (
          <div className="text-center py-20">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500 text-sm mb-2">
              {connected ? "Waiting for desktop stream..." : "Not connected to ClawBot Agent"}
            </p>
            <p className="text-slate-600 text-xs mb-4">
              Make sure the agent is running: <code className="bg-[#1e293b] px-2 py-0.5 rounded">node agent/server.js</code>
            </p>
            {!connected && (
              <button
                onClick={connect}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
