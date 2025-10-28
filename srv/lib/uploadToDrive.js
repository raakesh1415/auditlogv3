module.exports = uploadToDrive;
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

async function uploadToDrive(textFilePaths) {
    console.log('---Begin of Uploading to Google Drive---');
    
    try {
        // Authenticate with Google Drive
        const auth = await authenticateGoogleDrive();
        const drive = google.drive({ version: 'v3', auth });
        
        const totalFiles = textFilePaths.length;
        
        // Get or create the parent folder for audit logs
        const parentFolderId = await getOrCreateFolder(drive, 'Audit Logs', null);
        
        // Create a timestamped subfolder inside the parent folder
        const today = new Date(); // Today
        today.setHours(0, 0, 0, 0); // Today at 00:00:00
        const endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // one day before today
        const startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)); // 6 days ago from endDate
        const formatDate = (date) => date.toISOString().split('T')[0];  // Format Date only 

        const subFolderName = `AL_${formatDate(startDate)}_TO_${formatDate(endDate)}`;
        const subFolderId = await getOrCreateFolder(drive, subFolderName, parentFolderId);
        
        const uploadedFiles = [];
        
        // Upload each file to the subfolder
        for (let i = 0; i < totalFiles; i++) {
            const filePath = textFilePaths[i];
            const fileName = path.basename(filePath);
            
            const fileMetadata = {
                name: fileName,
                parents: [subFolderId]
            };
            
            const media = {
                mimeType: 'text/plain',
                body: fs.createReadStream(filePath)
            };
            
            const file = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink, size'
            });
            
            console.log(`Uploaded  ${i + 1}/${totalFiles}: ${file.data.name}`);
            uploadedFiles.push({
                name: file.data.name,
                id: file.data.id,
                link: file.data.webViewLink,
                size: file.data.size
            });
        }
        
        console.log(`Successfully uploaded ${uploadedFiles.length} files`);
        console.log('---End of Uploading to Google Drive---');

    } catch (error) {
        console.log(`Error during Google Drive upload: ${error.message}`);
        throw error;
    }
}

async function authenticateGoogleDrive() {
    try {
        // Authenticated using OAuth2
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
            );
            
            oauth2Client.setCredentials({
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN
            });
            
            return oauth2Client;
        }
        
        throw new Error('Google Drive authentication credentials not found in .env file');
    } catch (error) {
        console.log(`Authentication error: ${error.message}`);
        throw error;
    }
}

async function getOrCreateFolder(drive, folderName, parentFolderId = null) {
    try {
        // Build search query
        let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        
        // If parent folder is specified, search within that parent
        if (parentFolderId) {
            query += ` and '${parentFolderId}' in parents`;
        }
        
        // Search for existing folder
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        
        if (response.data.files.length > 0) {
            console.log(`Folder '${folderName}' already exists`);
            return response.data.files[0].id;
        }
        
        // Create new folder if it doesn't exist
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        };
        
        // Add parent folder if specified
        if (parentFolderId) {
            fileMetadata.parents = [parentFolderId];
        }
        
        const folder = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id'
        });
        
        console.log(`Created new folder '${folderName}'`);
        return folder.data.id;
    } catch (error) {
        console.log(`Error managing folder: ${error.message}`);
        throw error;
    }
}