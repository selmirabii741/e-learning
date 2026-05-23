import { NextResponse } from "next/server";
import { createEvent, listEvents } from "@/lib/calendar/repository";
import type { EventInput } from "@/lib/calendar/types";

export async function GET() {
  const events = await listEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as EventInput;
  const event = await createEvent(payload);
  return NextResponse.json(event, { status: 201 });
}
