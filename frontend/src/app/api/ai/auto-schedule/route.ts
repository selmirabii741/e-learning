import { NextResponse } from "next/server";
import { suggestSchedule } from "@/lib/calendar/ai";

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string };
  const suggestions = await suggestSchedule(body.title ?? "Focused study block");
  return NextResponse.json(suggestions);
}
