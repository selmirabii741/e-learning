import clsx from "clsx";
import {
  CalendarRange,
  CheckSquare,
} from "lucide-react";

type SidebarSection = "calendar" | "todo" | "reminders";

const items = [
  { id: "calendar", label: "Calendar", icon: CalendarRange },
  { id: "todo", label: "To-Do List", icon: CheckSquare },
] satisfies Array<{ id: Exclude<SidebarSection, "reminders">; label: string; icon: typeof CalendarRange }>;

interface EduSidebarProps {
  activeSection: SidebarSection;
  onNavigate: (section: SidebarSection) => void;
}

export function EduSidebar({ activeSection, onNavigate }: EduSidebarProps) {
  return (
    <aside className="glass-panel hidden xl:flex xl:w-[260px] xl:flex-col xl:rounded-[30px] xl:p-5">
      <div className="mb-8 flex items-center gap-3 border-b border-white/70 pb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 via-green-500 to-green-700 text-white shadow-soft">
          <CalendarRange className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight text-ink">EduAI</div>
          <div className="text-sm text-[#8FA098]">Student workflow hub</div>
        </div>
      </div>

      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8FA098]">Workspace</div>
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition duration-200",
                activeSection === item.id
                  ? "border-green-100 bg-green-50/95 text-green-700 shadow-soft"
                  : "border-transparent text-[#B7C2B8] hover:border-white/80 hover:bg-white/70 hover:text-ink"
              )}
              type="button"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-green-100 bg-gradient-to-br from-lime-50 via-white to-green-50 p-5 shadow-soft">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700">Quick access</div>
        <div className="mt-2 text-sm font-semibold text-ink">Reminder center</div>
        <p className="mt-2 text-sm leading-6 text-[#8FA098]">
          Review upcoming alerts and linked calendar items from the same workspace.
        </p>
        <button
          type="button"
          onClick={() => onNavigate("reminders")}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-green-600 px-4 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-green-700"
        >
          View reminders
        </button>
      </div>
    </aside>
  );
}
