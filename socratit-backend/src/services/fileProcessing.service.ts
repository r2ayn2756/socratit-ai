// ============================================================================
// FILE PROCESSING SERVICE
// Extract text from uploaded curriculum files (PDF, DOCX)
// ============================================================================

import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lazy load pdfjs-dist to avoid build issues
let pdfjsLib: any = null;
async function getPdfJsLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

// ============================================================================
// TEXT EXTRACTION
// ============================================================================

/**
 * Extract text from PDF file using pdfjs-dist
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = new Uint8Array(dataBuffer);

    // Dynamically load PDF.js
    const pdfjs = await getPdfJsLib();

    // Load PDF document
    const loadingTask = pdfjs.getDocument({ data });
    const pdfDocument = await loadingTask.promise;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Extract text from DOC file (plain text extraction)
 */
async function extractTextFromDOC(filePath: string): Promise<string> {
  try {
    // For .doc files, we'll try mammoth first (it may work for some)
    // If it fails, we'll read as plain text (limited functionality)
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch {
      // Fallback: read as plain text
      const buffer = await fs.readFile(filePath);
      return buffer.toString('utf-8');
    }
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOC: ${error.message}`);
  }
}

/**
 * Extract text based on file type
 */
export async function extractTextFromFile(
  filePath: string,
  fileType: string
): Promise<string> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '../../uploads/curriculum', path.basename(filePath));

  // Check if file exists
  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(`File not found: ${absolutePath}`);
  }

  switch (fileType.toLowerCase()) {
    case 'pdf':
      return await extractTextFromPDF(absolutePath);
    case 'docx':
      return await extractTextFromDOCX(absolutePath);
    case 'doc':
      return await extractTextFromDOC(absolutePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// ============================================================================
// TEXT CLEANING AND PREPROCESSING
// ============================================================================

/**
 * Clean and normalize extracted text
 */
export function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Trim
    .trim();
}

/**
 * Validate extracted text has meaningful content
 */
export function validateExtractedText(text: string): {
  isValid: boolean;
  reason?: string;
  wordCount: number;
} {
  const cleanText = cleanExtractedText(text);
  const wordCount = cleanText.split(/\s+/).length;

  if (cleanText.length < 100) {
    return {
      isValid: false,
      reason: 'Text too short (less than 100 characters)',
      wordCount: 0,
    };
  }

  if (wordCount < 50) {
    return {
      isValid: false,
      reason: 'Not enough words (less than 50)',
      wordCount,
    };
  }

  return {
    isValid: true,
    wordCount,
  };
}

// ============================================================================
// DATABASE UPDATES
// ============================================================================

/**
 * Process curriculum file and update database
 */
export async function processCurriculumFile(
  curriculumMaterialId: string
): Promise<{
  success: boolean;
  extractedText?: string;
  error?: string;
}> {
  try {
    // Get curriculum material record
    const material = await prisma.curriculumMaterial.findUnique({
      where: { id: curriculumMaterialId },
    });

    if (!material) {
      throw new Error('Curriculum material not found');
    }

    if (material.processingStatus === 'completed') {
      return {
        success: true,
        extractedText: material.extractedText || '',
      };
    }

    // Update status to processing
    await prisma.curriculumMaterial.update({
      where: { id: curriculumMaterialId },
      data: {
        processingStatus: 'processing',
        processingStartedAt: new Date(),
      },
    });

    // Extract text from file
    const rawText = await extractTextFromFile(
      material.filePath,
      material.fileType
    );

    // Clean text
    const cleanText = cleanExtractedText(rawText);

    // Validate text
    const validation = validateExtractedText(cleanText);

    if (!validation.isValid) {
      // Update status to failed
      await prisma.curriculumMaterial.update({
        where: { id: curriculumMaterialId },
        data: {
          processingStatus: 'failed',
          textExtractionError: validation.reason,
          processingCompletedAt: new Date(),
        },
      });

      return {
        success: false,
        error: validation.reason,
      };
    }

    // Update with extracted text
    await prisma.curriculumMaterial.update({
      where: { id: curriculumMaterialId },
      data: {
        extractedText: cleanText,
        processingStatus: 'completed',
        textExtractionError: null,
        processingCompletedAt: new Date(),
      },
    });

    console.log(`✅ Processed curriculum file ${curriculumMaterialId}: ${validation.wordCount} words extracted`);

    return {
      success: true,
      extractedText: cleanText,
    };
  } catch (error: any) {
    console.error(`❌ Failed to process curriculum file ${curriculumMaterialId}:`, error);

    // Update status to failed
    try {
      await prisma.curriculumMaterial.update({
        where: { id: curriculumMaterialId },
        data: {
          processingStatus: 'failed',
          textExtractionError: error.message,
          processingCompletedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error('Failed to update processing status:', updateError);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Process multiple curriculum files
 */
export async function processPendingCurriculumFiles(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const pendingFiles = await prisma.curriculumMaterial.findMany({
    where: {
      processingStatus: 'pending',
    },
    take: 10, // Process up to 10 at a time
  });

  let succeeded = 0;
  let failed = 0;

  for (const file of pendingFiles) {
    const result = await processCurriculumFile(file.id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return {
    processed: pendingFiles.length,
    succeeded,
    failed,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractTextFromFile,
  cleanExtractedText,
  validateExtractedText,
  processCurriculumFile,
  processPendingCurriculumFiles,
};
