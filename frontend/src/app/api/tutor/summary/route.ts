import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/tutor/rag'

export async function POST(_req: NextRequest) {
  try {
    const summary = await generateSummary()
    return NextResponse.json({ summary })
  } catch (err) {
    console.error('Summary error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Summary generation failed' },
      { status: 500 }
    )
  }
}
