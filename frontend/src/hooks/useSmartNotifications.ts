"use client";

import { useEffect, useRef } from "react";
import { parseISO, differenceInMinutes, isBefore } from "date-fns";
import { toast } from "sonner";
import { useCalendarStore } from "@/lib/calendar/store";

/** Keeps track of already-notified keys across re-renders (module-level singleton). */
const NOTIFIED = new Set<string>();

/** Fires a browser Notification if permission is granted. */
function browserNotify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

/**
 * Calls the backend to send a real email for a task deadline.
 * Silently fails if SMTP is not configured — the server already logs a preview.
 */
async function sendTaskEmail(taskId: string, taskTitle: string) {
  try {
    const res = await fetch(`/api/tasks/${taskId}/notify`, { method: "POST" });
    const data = await res.json();
    if (data.delivered) {
      toast.success(`📧 Email envoyé pour "${taskTitle}"`, {
        description: `Envoyé à ${data.to}`,
        duration: 6000
      });
    } else {
      // SMTP not configured — still let the user know
      console.log("[EduAI] Email preview (SMTP not configured):", data.preview);
      toast.info(`📧 Email simulé pour "${taskTitle}"`, {
        description: "SMTP non configuré — voir la console pour le contenu.",
        duration: 5000
      });
    }
  } catch (err) {
    console.error("[EduAI] sendTaskEmail failed:", err);
  }
}

export function useSmartNotifications() {
  const { overview } = useCalendarStore();

  /* Ask for browser notification permission once on mount */
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!overview) return;

    function tick() {
      const now = new Date();

      /* ── Events ─────────────────────────────────────────────── */
      overview!.events.forEach((event) => {
        const start = parseISO(event.startAt);
        if (isBefore(start, now)) return;

        const diff = differenceInMinutes(start, now);

        if (diff <= 60 && diff > 55 && !NOTIFIED.has(`60-${event.id}`)) {
          NOTIFIED.add(`60-${event.id}`);
          toast(`⏰ Événement dans 1 heure : ${event.title}`, {
            description: event.location ? `Lieu : ${event.location}` : undefined,
            duration: 8000
          });
        }

        if (diff <= 10 && diff > 8 && !NOTIFIED.has(`10-${event.id}`)) {
          NOTIFIED.add(`10-${event.id}`);
          toast.warning(`⚠️ Événement dans 10 min : ${event.title}`, { duration: 8000 });
          browserNotify("Événement dans 10 minutes", event.title);
        }

        if (diff <= 5 && diff > 3 && !NOTIFIED.has(`5-${event.id}`)) {
          NOTIFIED.add(`5-${event.id}`);
          toast.warning(`🚨 Événement dans 5 min : ${event.title}`, {
            icon: "⚠️",
            duration: 10000
          });
        }

        if (diff === 0 && !NOTIFIED.has(`0-${event.id}`)) {
          NOTIFIED.add(`0-${event.id}`);
          toast.success(`🚀 C'est maintenant : ${event.title}`, { duration: 12000 });
          browserNotify("C'est maintenant !", event.title);
        }
      });

      /* ── Tasks ───────────────────────────────────────────────── */
      overview!.tasks
        .filter((t) => !t.completed)
        .forEach((task) => {
          const deadline = parseISO(task.deadline);
          const diff = differenceInMinutes(deadline, now);

          // 2 hours before deadline
          if (diff <= 120 && diff > 115 && !NOTIFIED.has(`120-${task.id}`)) {
            NOTIFIED.add(`120-${task.id}`);
            toast.warning(`⏳ Tâche dans 2h : ${task.title}`, {
              description: "Pensez à la compléter avant l'échéance.",
              duration: 8000
            });
          }

          // 30 minutes before deadline
          if (diff <= 30 && diff > 27 && !NOTIFIED.has(`30-${task.id}`)) {
            NOTIFIED.add(`30-${task.id}`);
            toast.warning(`🔔 Tâche dans 30 min : ${task.title}`, {
              description: "Plus que 30 minutes !",
              duration: 10000
            });
            browserNotify("Tâche dans 30 minutes", task.title);
          }

          // Deadline reached (within 1 minute window)
          if (diff <= 0 && diff > -2 && !NOTIFIED.has(`due-${task.id}`)) {
            NOTIFIED.add(`due-${task.id}`);

            // In-app toast
            toast.error(`⏰ Échéance atteinte : ${task.title}`, {
              description: "L'heure est arrivée ! Un email vous a été envoyé.",
              duration: 15000
            });

            // Browser notification
            browserNotify("⏰ Échéance atteinte !", task.title);

            // Send real email via backend
            sendTaskEmail(task.id, task.title);
          }

          // Already overdue (page loaded after deadline)
          if (diff < -2 && diff > -5 && !NOTIFIED.has(`overdue-${task.id}`)) {
            NOTIFIED.add(`overdue-${task.id}`);
            toast.error(`🔴 Tâche en retard : ${task.title}`, {
              description: "Cette tâche est dépassée. Pensez à la marquer comme terminée.",
              duration: 12000
            });
          }
        });
    }

    // Run immediately, then every 30 seconds
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [overview]);
}
