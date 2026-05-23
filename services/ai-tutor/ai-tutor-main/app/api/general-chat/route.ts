import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_MODEL = 'llama-3.1-8b-instant'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are Scholarly, a smart and helpful AI assistant.
You can answer any question clearly and concisely.
Be direct, informative, and friendly.
Format your responses with markdown when helpful (bullet points, bold, code blocks etc).`
          },
          ...messages
        ],
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error: ${err}`)
    }

    const data = await res.json()
    return NextResponse.json({ answer: data.choices[0].message.content })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    )
  }
}