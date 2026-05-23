import { NextRequest, NextResponse } from 'next/server'
import { chunkText, generateEmbedding } from '@/lib/tutor/embeddings'
import { clearDocuments, insertDocument } from '@/lib/tutor/mongodb'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null

    let rawText = ''

    if (file) {
      const fileName = file.name?.toLowerCase() ?? ''
      const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf')

      if (isPdf) {
        // Some browsers/OSes send unreliable MIME types, so we also detect by extension.
        try {
          const pdfParseModule = await import('pdf-parse')
          const pdfParse = (pdfParseModule.default || pdfParseModule) as any
          const buffer = Buffer.from(await file.arrayBuffer())
          const parsed = await pdfParse(buffer)
          rawText = parsed.text
        } catch (pdfErr) {
          throw new Error(
            pdfErr instanceof Error
              ? `PDF parsing failed: ${pdfErr.message}`
              : 'PDF parsing failed'
          )
        }
      } else {
        rawText = await file.text()
      }
    } else if (text) {
      rawText = text
    } else {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: 'No readable text found in file. If this is a scanned PDF, OCR is required.' },
        { status: 400 }
      )
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
