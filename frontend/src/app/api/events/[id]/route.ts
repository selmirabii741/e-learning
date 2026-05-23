import { NextResponse } from "next/server";
import { updateEvent, deleteEvent, listEvents } from "@/lib/calendar/repository";
import type { EventUpdateInput } from "@/lib/calendar/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const events = await listEvents();
  const event = events.find((e) => e.id === params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updates = (await request.json()) as EventUpdateInput;
  const event = await updateEvent(params.id, updates);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await deleteEvent(params.id);
  return NextResponse.json({ success: true });
}
