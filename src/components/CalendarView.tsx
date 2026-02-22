"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
} from "lucide-react";
import { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  events: CalendarEvent[];
  onUpdate: (events: CalendarEvent[]) => void;
}

export default function CalendarView({ events, onUpdate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    time: "09:00",
    endTime: "10:00",
    color: "#3b82f6",
    description: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = getDateStr(day);
    return events.filter((e) => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    setSelectedDate(getDateStr(day));
  };

  const handleAddEvent = () => {
    if (!form.title.trim() || !selectedDate) return;
    const newEvent: CalendarEvent = {
      id: uuidv4(),
      title: form.title,
      date: selectedDate,
      time: form.time,
      endTime: form.endTime,
      color: form.color,
      description: form.description,
    };
    onUpdate([...events, newEvent]);
    setForm({ title: "", time: "09:00", endTime: "10:00", color: "#3b82f6", description: "" });
    setShowForm(false);
  };

  const deleteEvent = (id: string) => {
    onUpdate(events.filter((e) => e.id !== id));
  };

  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Today
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = getDateStr(day);
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square p-1 rounded-lg text-sm flex flex-col items-center justify-start transition-all relative",
                    isToday && "ring-2 ring-blue-500",
                    isSelected ? "bg-blue-600/20 border border-blue-500" : "hover:bg-[#334155]",
                    "border border-transparent"
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday ? "text-blue-400" : "text-slate-300")}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: e.color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a date"}
            </h3>
            {selectedDate && (
              <button
                onClick={() => setShowForm(true)}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Add Event Form */}
          {showForm && selectedDate && (
            <div className="mb-4 p-3 bg-[#0f172a] rounded-lg border border-[#334155] space-y-3 animate-fade-in">
              <input
                type="text"
                placeholder="Event title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-10 h-8 cursor-pointer bg-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddEvent}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 bg-[#334155] text-white text-xs font-medium rounded-lg hover:bg-[#475569] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Events List */}
          <div className="space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                {selectedDate ? "No events" : "Click a day to see events"}
              </p>
            ) : (
              selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-[#0f172a] border border-[#334155] group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div
                        className="w-1 h-full min-h-[2rem] rounded-full mt-0.5"
                        style={{ backgroundColor: event.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">
                            {event.time} - {event.endTime}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
