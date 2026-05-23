import { NextResponse } from "next/server";
import { runReminderDispatch } from "@/lib/calendar/notifications";

export async function POST() {
  const result = await runReminderDispatch();
  return NextResponse.json(result);
}

export async function GET() {
  const result = await runReminderDispatch();
  return NextResponse.json(result);
}
