"use client";

import { useEffect, useMemo, useState } from "react";
import { addMinutes } from "date-fns";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem } from "@/components/calendar/TaskItem";
import { isTaskForTab, usePlannerStore } from "@/lib/calendar/planner-store";

export function TodoList() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { tasks, activeTab, setActiveTab, addTask, toggleTask, reorderTasks, deleteTask, addTaskToCalendar } = usePlannerStore();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [deadline, setDeadline] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredTasks = useMemo(
    () => tasks.filter((task) => isTaskForTab(task, activeTab, new Date())),
    [tasks, activeTab]
  );
  const completedCount = tasks.filter((task) => task.completed).length;

  function handleAddTask() {
    const clean = title.trim();
    if (!clean) return;
    addTask({ title: clean, deadline: new Date(deadline).toISOString(), priority });
    setTitle("");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    reorderTasks(activeId, overId);
  }

  // Set the default deadline on mount (client-side only) to avoid hydration mismatch
  useEffect(() => {
    if (!deadline) {
      setDeadline(addMinutes(new Date(), 240).toISOString().slice(0, 16));
    }
  }, [deadline]);

  if (!mounted) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-32 items-center justify-center text-sm text-[#8FA098]">Loading tasks…</div>
      </aside>
    );
  }

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">To-Do List</h2>
        <button
          type="button"
          onClick={handleAddTask}
          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New task..."
          className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-green-500"
        />
        <input
          type="datetime-local"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-green-500"
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as "high" | "medium" | "low")}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-green-500"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "today", "upcoming", "completed"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              activeTab === tab ? "bg-green-100 text-green-700" : "text-[#B7C2B8] hover:bg-slate-100"
            }`}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-4 space-y-2">
            {filteredTasks.map((task) => (
              <SortableTask key={task.id} taskId={task.id}>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <TaskItem
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onAddToCalendar={() => addTaskToCalendar(task.id)}
                  />
                </motion.div>
              </SortableTask>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="mt-4 text-xs text-[#8FA098]">
        Completed tasks: <span className="font-semibold text-[#B7C2B8]">{completedCount}</span>
      </p>
    </aside>
  );
}

function SortableTask({ taskId, children }: { taskId: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: taskId });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-70" : ""}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
