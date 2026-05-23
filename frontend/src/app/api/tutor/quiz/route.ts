import { NextRequest, NextResponse } from 'next/server'
import { generateQuiz } from '@/lib/tutor/rag'

export async function POST(_req: NextRequest) {
  try {
    const quiz = await generateQuiz()
    return NextResponse.json({ quiz })
  } catch (err) {
    console.error('Quiz error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Quiz generation failed' },
      { status: 500 }
    )
  }
}
