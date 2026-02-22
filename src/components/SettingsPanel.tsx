"use client";

import { useState } from "react";
import { Save, ExternalLink, Check } from "lucide-react";
import { IntegrationConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  integrations: IntegrationConfig[];
  onUpdate: (integrations: IntegrationConfig[]) => void;
}

const integrationIcons: Record<string, string> = {
  Slack: "S",
  "Google Calendar": "G",
  Jira: "J",
  Trello: "T",
  GitHub: "H",
};

const integrationColors: Record<string, string> = {
  Slack: "bg-purple-600",
  "Google Calendar": "bg-blue-600",
  Jira: "bg-blue-500",
  Trello: "bg-blue-400",
  GitHub: "bg-gray-600",
};

export default function SettingsPanel({ integrations, onUpdate }: SettingsPanelProps) {
  const [saved, setSaved] = useState(false);

  const toggleIntegration = (index: number) => {
    const updated = [...integrations];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    onUpdate(updated);
  };

  const updateField = (index: number, field: "apiKey" | "webhookUrl", value: string) => {
    const updated = [...integrations];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Integrations */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">API Integrations</h2>
        <div className="space-y-4">
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className="bg-[#1e293b] rounded-xl border border-[#334155] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm",
                      integrationColors[integration.name] ?? "bg-slate-600"
                    )}
                  >
                    {integrationIcons[integration.name] ?? "?"}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{integration.name}</h3>
                    <span
                      className={cn(
                        "text-xs",
                        integration.enabled ? "text-green-400" : "text-slate-500"
                      )}
                    >
                      {integration.enabled ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleIntegration(index)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    integration.enabled ? "bg-blue-600" : "bg-slate-600"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                      integration.enabled ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>

              {integration.enabled && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">API Key</label>
                    <input
                      type="password"
                      placeholder="Enter API key..."
                      value={integration.apiKey}
                      onChange={(e) => updateField(index, "apiKey", e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Webhook URL</label>
                    <input
                      type="url"
                      placeholder="https://hooks.example.com/..."
                      value={integration.webhookUrl}
                      onChange={(e) => updateField(index, "webhookUrl", e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* General Settings */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">General</h2>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Desktop Notifications</p>
              <p className="text-xs text-slate-400">Receive browser push notifications</p>
            </div>
            <button className="relative w-11 h-6 rounded-full bg-blue-600 transition-colors">
              <span className="absolute top-0.5 left-[22px] w-5 h-5 rounded-full bg-white transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Real-time Updates</p>
              <p className="text-xs text-slate-400">Auto-refresh dashboard data</p>
            </div>
            <button className="relative w-11 h-6 rounded-full bg-blue-600 transition-colors">
              <span className="absolute top-0.5 left-[22px] w-5 h-5 rounded-full bg-white transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Data Export</p>
              <p className="text-xs text-slate-400">Export all dashboard data as JSON</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#0f172a] border border-[#334155] rounded-lg hover:bg-[#334155] transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={cn(
          "flex items-center gap-2 px-6 py-2.5 font-medium text-sm rounded-lg transition-all",
          saved
            ? "bg-green-600 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}
