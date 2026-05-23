import { NextRequest, NextResponse } from 'next/server'
import { chunkText, generateEmbedding } from '@/lib/embeddings'
import { clearDocuments, insertDocument } from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null

    let rawText = ''

    if (file) {
      if (file.type === 'application/pdf') {
        // Dynamically import pdf-parse to avoid SSR issues
        const pdfParse = (await import('pdf-parse')).default
        const buffer = Buffer.from(await file.arrayBuffer())
        const parsed = await pdfParse(buffer)
        rawText = parsed.text
      } else {
        rawText = await file.text()
      }
    } else if (text) {
      rawText = text
    } else {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'No text content found' }, { status: 400 })
    }

    // Clear existing documents
    await clearDocuments()

    // Chunk the text
    const chunks = chunkText(rawText)

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Could not extract text chunks' }, { status: 400 })
    }

    // Generate embeddings and store
    let stored = 0
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk)
      await insertDocument(chunk, embedding)
      stored++
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${stored} chunks from your course material.`,
      chunks: stored,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
