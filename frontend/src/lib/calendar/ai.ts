import { addDays, format, parseISO, set } from "date-fns";
import { getOverview } from "@/lib/calendar/repository";
import type { AutoScheduleSuggestion } from "@/lib/calendar/types";

const candidateHours = [9, 11, 14, 16];

export async function suggestSchedule(title: string, userId?: string): Promise<AutoScheduleSuggestion[]> {
  const overview = await getOverview(userId);
  const suggestions: AutoScheduleSuggestion[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = addDays(new Date(), dayOffset);
    const dayKey = format(date, "yyyy-MM-dd");
    const dayEvents = overview.events.filter((event) => event.startAt.startsWith(dayKey));

    for (const hour of candidateHours) {
      const start = set(new Date(date), { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 });
      const end = set(new Date(date), { hours: hour + 1, minutes: 0, seconds: 0, milliseconds: 0 });
      const busy = dayEvents.some((event) => {
        const eventStart = parseISO(event.startAt);
        const eventEnd = parseISO(event.endAt);
        return start < eventEnd && end > eventStart;
      });

      if (!busy) {
        suggestions.push({
          title,
          recommendedDate: format(start, "yyyy-MM-dd"),
          startTime: format(start, "HH:mm"),
          endTime: format(end, "HH:mm"),
          rationale: `Free study slot detected around ${format(start, "EEEE")} at ${format(start, "HH:mm")}.`
        });
      }

      if (suggestions.length >= 3) {
        return suggestions;
      }
    }
  }

  return suggestions;
}
