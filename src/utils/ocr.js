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
      const worker = await createWorker({
        logger: msg => console.log('[Tesseract Worker]', msg)
      });

      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.',
      });

      const { data } = await worker.recognize(file.path);
      const codes = extractCodesFromText(data.text);
      
      if (codes.length > 0) {
        extractedCodes.push({
          page: 1,
          codes: codes
        });
      }
      
      await worker.terminate();
    }

    console.log('[OCR Utility] Extracted codes:', extractedCodes);
    return extractedCodes;
  } catch (error) {
    console.error('[OCR Utility] Error extracting document codes:', error);
    throw error;
  }
}

function extractCodesFromText(text) {
  const codeRegex = /[A-Z]-\d{3}/g;
  return [...new Set(text.match(codeRegex) || [])];
}

module.exports = {
  extractDocumentCodes
}; 