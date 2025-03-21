const Tesseract = require('tesseract.js');
const { createWorker } = Tesseract;
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const pdfParse = require('pdf-parse');

async function extractTextFromPdf(pdfPath) {
  try {
    console.log('[OCR Utility] Extracting text from PDF:', pdfPath);
    const dataBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('[OCR Utility] PDF text extraction failed:', error);
    throw error;
  }
}

async function extractDocumentCodes(file) {
  try {
    console.log('[OCR Utility] Starting document code extraction:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    
    let extractedCodes = [];
    
    if (file.type === 'application/pdf') {
      console.log('[OCR Utility] Processing PDF file');
      const dataBuffer = await fs.readFile(file.path);
      const pdfData = await pdfParse(dataBuffer);
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdfData.numpages; pageNum++) {
        const pageText = pdfData.text; // Gets text from current page
        const codes = extractCodesFromText(pageText);
        
        if (codes.length > 0) {
          extractedCodes.push({
            page: pageNum,
            codes: codes
          });
        }
      }
    } else {
      console.log('[OCR Utility] Processing image file');
      const worker = await createWorker();

      try {
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        // Updated parameters to include more characters
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.',
          tessedit_pageseg_mode: '1',  // Automatic page segmentation
          tessedit_ocr_engine_mode: '1' // Neural net LSTM only
        });

        const { data } = await worker.recognize(file.path);
        const codes = extractCodesFromText(data.text);
        
        if (codes.length > 0) {
          extractedCodes.push({
            page: 1,
            codes: codes
          });
        }
      } finally {
        await worker.terminate();
      }
    }

    console.log('[OCR Utility] Extracted codes:', extractedCodes);
    return extractedCodes;
  } catch (error) {
    console.error('[OCR Utility] Error extracting document codes:', error);
    throw error;
  }
}

function extractCodesFromText(text) {
  // Common sheet number patterns
  const patterns = [
    /[A-Z]-\d{3}/g,           // Format: A-101
    /[A-Z]\d{1,2}\.\d{1,2}/g, // Format: S1.1
    /[A-Z]\d{3}/g,            // Format: A101
    /[A-Z]-\d{2}/g,           // Format: A-01
    /[A-Z]\d{2}/g,            // Format: A01
    /[A-Z]-[A-Z]\d{2}/g,      // Format: A-B01
    /[A-Z][A-Z]\d{2}/g        // Format: AB01
  ];

  // Find all matches for each pattern
  const allMatches = patterns.flatMap(pattern => {
    const matches = text.match(pattern) || [];
    return [...new Set(matches)]; // Remove duplicates within each pattern
  });

  // Remove duplicates across all patterns and sort
  return [...new Set(allMatches)].sort();
}

module.exports = {
  extractDocumentCodes
}; 