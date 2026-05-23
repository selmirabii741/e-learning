import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

async function groq(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const d = await res.json()
  return d.choices[0].message.content
}

export async function POST(req: NextRequest) {
  try {
    const { content, level, numQuestions } = await req.json()
    if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 })

    const levelDesc = level === 'easy' ? 'simple, factual, recall-based'
      : level === 'medium' ? 'intermediate, requiring understanding and application'
      : 'advanced, requiring analysis, synthesis and critical thinking'

    const prompt = `You are an expert exam creator. Generate a quiz based STRICTLY on the provided notes.

Level: ${level.toUpperCase()} — questions must be ${levelDesc}.
Number of questions: ${numQuestions}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation. Use this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

"correct" is the 0-based index of the correct option.

Notes:
${content.slice(0, 5000)}`

    const raw = await groq(prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json({ quiz: parsed.questions })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
