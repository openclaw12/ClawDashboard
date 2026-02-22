"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Hash, Send, Circle, Search } from "lucide-react";
import { Message } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface CommunicationHubProps {
  messages: Message[];
  onUpdate: (messages: Message[]) => void;
}

const channels = ["All", "#general", "#engineering", "#design", "DM"];

export default function CommunicationHub({ messages, onUpdate }: CommunicationHubProps) {
  const [activeChannel, setActiveChannel] = useState("All");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = messages.filter((m) => {
    const matchesChannel = activeChannel === "All" || m.channel === activeChannel;
    const matchesSearch =
      !searchQuery ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: uuidv4(),
      sender: "You",
      channel: activeChannel === "All" ? "#general" : activeChannel,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
      avatar: "ME",
    };
    onUpdate([msg, ...messages]);
    setNewMessage("");
  };

  const markAsRead = (id: string) => {
    onUpdate(messages.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const markAllRead = () => {
    onUpdate(messages.map((m) => ({ ...m, read: true })));
  };

  const unreadByChannel = (channel: string) => {
    if (channel === "All") return messages.filter((m) => !m.read).length;
    return messages.filter((m) => m.channel === channel && !m.read).length;
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden h-[calc(100vh-10rem)]">
        {/* Channel Sidebar */}
        <div className="lg:col-span-1 border-r border-[#334155] flex flex-col">
          <div className="p-4 border-b border-[#334155]">
            <h3 className="text-sm font-semibold text-white mb-3">Channels</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map((ch) => {
              const unread = unreadByChannel(ch);
              return (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(ch)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    activeChannel === ch
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-[#334155]"
                  )}
                >
                  {ch.startsWith("#") ? (
                    <Hash className="w-4 h-4 flex-shrink-0" />
                  ) : ch === "DM" ? (
                    <Circle className="w-4 h-4 flex-shrink-0" />
                  ) : null}
                  <span className="truncate">{ch}</span>
                  {unread > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t border-[#334155]">
            <button
              onClick={markAllRead}
              className="w-full px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#0f172a] rounded-lg hover:bg-[#334155] transition-colors"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="p-4 border-b border-[#334155]">
            <h3 className="text-sm font-semibold text-white">
              {activeChannel === "All" ? "All Messages" : activeChannel}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredMessages.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">No messages</p>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => markAsRead(msg.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                    !msg.read
                      ? "bg-blue-500/5 border border-blue-500/20"
                      : "bg-[#0f172a] border border-[#334155] hover:border-[#475569]"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                      msg.sender === "You" ? "bg-blue-600" : "bg-slate-600"
                    )}
                  >
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{msg.sender}</span>
                      <span className="text-xs text-slate-600">{msg.channel}</span>
                      {!msg.read && <span className="w-2 h-2 rounded-full bg-blue-500 pulse-dot" />}
                    </div>
                    <p className="text-sm text-slate-300">{msg.content}</p>
                    <span className="text-xs text-slate-600 mt-1 inline-block">
                      {formatRelativeTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#334155]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Message ${activeChannel === "All" ? "#general" : activeChannel}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
