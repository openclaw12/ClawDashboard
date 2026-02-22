"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, X, GripVertical } from "lucide-react";
import { KanbanColumn, KanbanCard } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectBoardProps {
  columns: KanbanColumn[];
  onUpdate: (columns: KanbanColumn[]) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

const columnColors: Record<string, string> = {
  backlog: "border-t-slate-500",
  "in-progress": "border-t-blue-500",
  review: "border-t-yellow-500",
  done: "border-t-green-500",
};

export default function ProjectBoard({ columns, onUpdate }: ProjectBoardProps) {
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ title: "", description: "", assignee: "", priority: "medium" as KanbanCard["priority"] });
  const [draggedCard, setDraggedCard] = useState<{ card: KanbanCard; fromColumn: string } | null>(null);

  const addCard = (columnId: string) => {
    if (!newCard.title.trim()) return;
    const card: KanbanCard = {
      id: uuidv4(),
      title: newCard.title,
      description: newCard.description,
      assignee: newCard.assignee,
      tags: [],
      priority: newCard.priority,
    };
    onUpdate(
      columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
      )
    );
    setNewCard({ title: "", description: "", assignee: "", priority: "medium" });
    setAddingTo(null);
  };

  const deleteCard = (columnId: string, cardId: string) => {
    onUpdate(
      columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col
      )
    );
  };

  const handleDragStart = (card: KanbanCard, columnId: string) => {
    setDraggedCard({ card, fromColumn: columnId });
  };

  const handleDrop = (toColumnId: string) => {
    if (!draggedCard) return;
    if (draggedCard.fromColumn === toColumnId) {
      setDraggedCard(null);
      return;
    }
    onUpdate(
      columns.map((col) => {
        if (col.id === draggedCard.fromColumn) {
          return { ...col, cards: col.cards.filter((c) => c.id !== draggedCard.card.id) };
        }
        if (col.id === toColumnId) {
          return { ...col, cards: [...col.cards, draggedCard.card] };
        }
        return col;
      })
    );
    setDraggedCard(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
            className={cn(
              "flex-shrink-0 w-72 bg-[#1e293b] rounded-xl border border-[#334155] border-t-2 flex flex-col max-h-[calc(100vh-12rem)]",
              columnColors[col.id] ?? "border-t-slate-500"
            )}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-[#334155]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{col.title}</h3>
                  <span className="text-xs bg-[#0f172a] text-slate-400 px-2 py-0.5 rounded-full">
                    {col.cards.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingTo(addingTo === col.id ? null : col.id)}
                  className="p-1 rounded hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Add Card Form */}
              {addingTo === col.id && (
                <div className="p-3 bg-[#0f172a] rounded-lg border border-[#334155] space-y-2 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Card title"
                    value={newCard.title}
                    onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Assignee"
                    value={newCard.assignee}
                    onChange={(e) => setNewCard({ ...newCard, assignee: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addCard(col.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingTo(null)}
                      className="px-3 py-1 bg-[#334155] text-white text-xs rounded hover:bg-[#475569] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {col.cards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card, col.id)}
                  className="p-3 bg-[#0f172a] rounded-lg border border-[#334155] hover:border-[#475569] cursor-grab active:cursor-grabbing group card-hover"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className={cn("w-2 h-2 rounded-full", priorityColors[card.priority])} />
                      <span className="text-sm font-medium text-white">{card.title}</span>
                    </div>
                    <button
                      onClick={() => deleteCard(col.id, card.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {card.description && (
                    <p className="text-xs text-slate-400 mb-2 ml-5">{card.description}</p>
                  )}
                  <div className="flex items-center justify-between ml-5">
                    <div className="flex gap-1 flex-wrap">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded bg-[#1e293b] text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {card.assignee && (
                      <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-medium" title={card.assignee}>
                        {card.assignee[0]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
