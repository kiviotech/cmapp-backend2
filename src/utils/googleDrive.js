const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Try to load credentials, fallback to API key if not available
let drive;
try {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../config/google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  });
  drive = google.drive({ version: 'v3', auth });
} catch (error) {
  console.log('[Google Drive] Using API key authentication');
  drive = google.drive({ 
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY || 'YOUR_API_KEY_HERE'
  });
}

function extractFileId(url) {
  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,  // Direct file link
    /\/folders\/([a-zA-Z0-9-_]+)/,  // Folder link
    /id=([a-zA-Z0-9-_]+)/,         // Old format
    /([a-zA-Z0-9-_]{33})/          // Direct ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  throw new Error('Invalid Google Drive URL');
}

async function downloadFile(fileId) {
  try {
    console.log('[Google Drive] Downloading file:', fileId);
    
    const tempPath = path.join(os.tmpdir(), `temp_${fileId}`);
    const dest = fs.createWriteStream(tempPath);

    const res = await drive.files.get(
      { 
        fileId, 
        alt: 'media',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        acknowledgeAbuse: true // Required for some files
      },
      { responseType: 'stream' }
    );

    await new Promise((resolve, reject) => {
      res.data
        .on('end', () => resolve())
        .on('error', err => reject(err))
        .pipe(dest);
    });

    return tempPath;
  } catch (error) {
    console.error('[Google Drive] Download failed:', error);
    throw error;
  }
}

async function listFolderContents(folderId) {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType='application/pdf' or mimeType contains 'image/')`,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    return res.data.files;
  } catch (error) {
    console.error('[Google Drive] Listing failed:', error);
    throw error;
  }
}

module.exports = {
  downloadFile,
  listFolderContents,
  extractFileId
}; 