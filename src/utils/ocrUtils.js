const createWorker = require('tesseract.js').createWorker;

const extractDocumentCodes = async (file) => {
  try {
    console.log('[OCR Utility] Starting document code extraction:', {
      fileName: file.name || '',
      fileType: file.type || file.mime,
      fileSize: file.size || 0
    });

    const worker = await createWorker();

    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(file.buffer || file);
    
    // Extract codes matching pattern (e.g., A-101)
    const codePattern = /[A-Z]-\d{3}/g;
    const codes = text.match(codePattern) || [];
    
    await worker.terminate();

    console.log('[OCR Utility] Extracted codes:', [{ page: 1, codes }]);
    
    return [{ 
      page: 1,
      codes
    }];

  } catch (error) {
    console.error('[OCR Utility] Error processing document:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  extractDocumentCodes
}; 