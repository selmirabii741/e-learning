import { NextRequest, NextResponse } from 'next/server'
import { generateFlashcards } from '@/lib/tutor/rag'

export async function POST(_req: NextRequest) {
  try {
    const flashcards = await generateFlashcards()
    return NextResponse.json({ flashcards })
  } catch (err) {
    console.error('Flashcards error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Flashcards generation failed' },
      { status: 500 }
    )
  }
}
