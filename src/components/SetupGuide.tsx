"use client";

import { useState } from "react";
import {
  Copy,
  CheckCircle,
  Monitor,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {label && <p className="text-xs text-slate-400 mb-1.5">{label}</p>}
      <div className="bg-[#0f172a] rounded-lg border border-[#334155] p-4 pr-12 overflow-x-auto">
        <code className="text-sm text-green-400 whitespace-pre-wrap break-all">{code}</code>
      </div>
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-2 rounded-lg transition-all",
          label ? "top-8" : "top-2",
          copied
            ? "bg-green-500/20 text-green-400"
            : "bg-[#334155]/50 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100"
        )}
        title="Copy"
      >
        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

interface SetupGuideProps {
  onNavigateToDesktop: () => void;
}

export default function SetupGuide({ onNavigateToDesktop }: SetupGuideProps) {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup Guide</h2>
        <p className="text-slate-400">
          Connect your Raspberry Pi (or any Linux computer) to this dashboard in 2 steps.
          After setup, everything auto-starts on boot — just press Connect.
        </p>
      </div>

      {/* What you need */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
        <h3 className="text-lg font-semibold text-white mb-3">What You Need</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            A Raspberry Pi (or Linux computer) with a desktop environment
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            Internet connection on the Pi
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            SSH access or a terminal on the Pi (just for initial setup)
          </li>
        </ul>
      </div>

      {/* Step 1 */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">1</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Run the installer on your Pi</h3>
            <p className="text-sm text-slate-400">Open a terminal on your Pi and run this single command:</p>
          </div>
        </div>

        <CopyBlock code="curl -fsSL https://raw.githubusercontent.com/openclaw12/ClawDashboard/master/agent/setup-pi.sh | bash" />

        <div className="mt-4 space-y-2 text-sm text-slate-400">
          <p>This automatically installs everything needed:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Node.js (if not installed)</li>
            <li>scrot (screenshot tool)</li>
            <li>Cloudflare Tunnel (for secure remote access)</li>
            <li>The ClawBot agent</li>
            <li>Auto-start services (runs on boot)</li>
          </ul>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-200">
              The Pi will <strong>automatically register</strong> with this dashboard.
              You don&apos;t need to copy any URLs — just press Connect after setup finishes.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">2</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Press Connect</h3>
            <p className="text-sm text-slate-400">Go to Live Desktop and click the Connect button. It will find your Pi automatically.</p>
          </div>
        </div>

        <button
          onClick={onNavigateToDesktop}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Monitor className="w-5 h-5" />
          Go to Live Desktop
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-sm text-slate-300 mt-4">
          The dashboard will remember your Pi and auto-connect on future visits.
          Walk away from the Pi — everything auto-starts on boot.
        </p>
      </div>

      {/* Troubleshooting */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-slate-400" />
          Troubleshooting
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">Connect button says &quot;No Pi found&quot;?</p>
            <p className="text-sm text-slate-400 mb-2">
              The Pi may need a moment to register. Wait 30 seconds and try again.
              If it still doesn&apos;t work, restart the services:
            </p>
            <CopyBlock code="cd ~/ClawDashboard && git pull origin master && systemctl --user restart clawbot-agent && systemctl --user restart clawbot-tunnel" />
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Pi rebooted and can&apos;t connect?</p>
            <p className="text-sm text-slate-400 mb-2">
              Free Cloudflare tunnels get a new URL on each restart. The Pi should auto-register the new URL
              within 30 seconds of booting. Just press Connect again.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Want to enter the URL manually?</p>
            <p className="text-sm text-slate-400 mb-2">
              On the Connect screen, click &quot;Enter URL manually&quot; below the Connect button. Get the URL from:
            </p>
            <CopyBlock code="cat ~/.clawbot-tunnel-url" />
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Agent not capturing screenshots?</p>
            <p className="text-sm text-slate-400 mb-2">Check if scrot works:</p>
            <CopyBlock code="DISPLAY=:0 scrot /tmp/test.jpg && echo 'Working!' || echo 'Failed'" />
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Check service status:</p>
            <CopyBlock code="systemctl --user status clawbot-agent && systemctl --user status clawbot-tunnel" />
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Test that the agent is working locally:</p>
            <CopyBlock code={`curl -s http://localhost:9900/health && echo "" && curl -s http://localhost:9900/frame -o /dev/null -w "Frame: %{http_code}, Size: %{size_download} bytes"`} />
          </div>
        </div>
      </div>
    </div>
  );
}
