import { NextRequest, NextResponse } from 'next/server'
import { generateRAGAnswer } from '@/lib/rag'

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const answer = await generateRAGAnswer(question)

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 }
    )
  }
}
