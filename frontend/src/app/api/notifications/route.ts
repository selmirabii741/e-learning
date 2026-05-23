import { NextResponse } from "next/server";
import { getOverview } from "@/lib/calendar/repository";

export async function GET() {
  const overview = await getOverview();
  return NextResponse.json(overview.notifications);
}
