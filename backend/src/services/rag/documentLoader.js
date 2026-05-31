/**
 * documentLoader.js — Extract text from PDF buffers or lesson text content.
 */

/**
 * Extract text from a PDF buffer using pdf-parse.
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromPDF(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    return '';
  }

  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(pdfBuffer);
    return data.text?.trim() || '';
  } catch (err) {
    console.error('❌ [documentLoader] Erreur extraction PDF:', err.message);
    return '';
  }
}

/**
 * Get text content from a lesson — tries PDF first, then text content.
 * @param {Object} lesson - Mongoose lesson subdocument
 * @returns {Promise<{ text: string, source: string }>}
 */
export async function getLessonText(lesson) {
  if (!lesson) return { text: '', source: '' };

  // 1. Try PDF buffer
  if (lesson.pdfData && lesson.pdfData.length > 0) {
    const text = await extractTextFromPDF(lesson.pdfData);
    if (text) {
      return {
        text,
        source: lesson.pdfName || 'PDF du cours',
      };
    }
  }

  // 2. Fallback to text content
  if (lesson.content?.trim()) {
    return {
      text: lesson.content.trim(),
      source: `Contenu texte: ${lesson.title}`,
    };
  }

  return { text: '', source: '' };
}
