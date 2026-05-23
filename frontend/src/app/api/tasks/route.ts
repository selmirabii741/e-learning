import { NextResponse } from "next/server";
import { CalendarConflictError, createTask, listTasks } from "@/lib/calendar/repository";
import type { TaskInput } from "@/lib/calendar/types";

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TaskInput;
    const task = await createTask(payload);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof CalendarConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create task right now." }, { status: 500 });
  }
}
