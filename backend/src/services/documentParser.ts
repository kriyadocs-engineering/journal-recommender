import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import fs from 'fs/promises';

export interface ParsedDocument {
  title: string;
  abstract: string;
  fullText: string;
}

// Extract title from text (usually the first significant line)
function extractTitle(text: string): string {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    // Skip very short lines or common headers
    if (trimmed.length > 10 && trimmed.length < 300) {
      // Skip if it looks like a header (all caps, starts with common patterns)
      if (!trimmed.match(/^(abstract|introduction|keywords|author|submitted|received)/i)) {
        return trimmed;
      }
    }
  }

  return lines[0]?.trim() || 'Untitled Manuscript';
}

// Extract abstract from text
function extractAbstract(text: string): string {
  const lowerText = text.toLowerCase();

  // Try to find abstract section
  const abstractPatterns = [
    /abstract[:\s]*\n?([\s\S]*?)(?=\n\s*(introduction|keywords|background|1\.|methods))/i,
    /abstract[:\s]*([\s\S]{100,2000}?)(?=\n\n)/i,
    /summary[:\s]*\n?([\s\S]*?)(?=\n\s*(introduction|keywords|background|1\.))/i,
  ];

  for (const pattern of abstractPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const abstract = match[1].trim();
      if (abstract.length > 100) {
        return abstract.slice(0, 2000); // Limit length
      }
    }
  }

  // Fallback: take first substantial paragraph after title
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 100);
  if (paragraphs.length > 1) {
    return paragraphs[1].trim().slice(0, 2000);
  }

  return paragraphs[0]?.trim().slice(0, 2000) || '';
}

// Parse PDF files
export async function parsePdf(filePath: string): Promise<ParsedDocument> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);

  const text = data.text;
  const title = extractTitle(text);
  const abstract = extractAbstract(text);

  return {
    title,
    abstract,
    fullText: text
  };
}

// Parse DOC/DOCX files
export async function parseDocx(filePath: string): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;

  const title = extractTitle(text);
  const abstract = extractAbstract(text);

  return {
    title,
    abstract,
    fullText: text
  };
}

// Main parser function
export async function parseDocument(filePath: string, mimeType: string): Promise<ParsedDocument> {
  if (mimeType === 'application/pdf') {
    return parsePdf(filePath);
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return parseDocx(filePath);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
