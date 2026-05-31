/**
 * textSplitter.js — Split text into chunks using LangChain's RecursiveCharacterTextSplitter.
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

/**
 * Split text into chunks.
 * @param {string} text - The text to split
 * @returns {Promise<string[]>} - Array of text chunks
 */
export async function splitText(text) {
  if (!text?.trim()) return [];

  try {
    const chunks = await splitter.splitText(text);
    // Filter out very small chunks (likely noise)
    return chunks.filter((chunk) => chunk.trim().length > 20);
  } catch (err) {
    console.error('❌ [textSplitter] Erreur découpage:', err.message);
    return [];
  }
}
