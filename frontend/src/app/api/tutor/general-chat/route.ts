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
            content: `Tu es EduAI, un assistant IA intelligent et pédagogique.
Tu réponds à toutes les questions de manière claire et concise.
Sois direct, informatif et bienveillant.
Formate tes réponses en markdown quand c'est utile (listes, gras, blocs de code, etc).`
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
