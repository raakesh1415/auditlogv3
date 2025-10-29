module.exports = uploadToDrive;

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { getDestination } = require('@sap-cloud-sdk/connectivity');

async function uploadToDrive(textFilePaths) {
    console.log('---Begin of Uploading to Google Drive---');

    try {
        // Get credentials from destination
        const destinationName = 'GOOGLEDRIVE_DESTINATION';
        const destination = await getDestination({ destinationName });
        if (!destination) {
            throw new Error(`Destination '${destinationName}' not found`);
        }

        const {
            client_id,
            client_secret,
            refresh_token,
            redirect_uri
        } = destination.originalProperties || destination.destinationConfiguration || {};

        if (!client_id || !client_secret || !refresh_token) {
            throw new Error(`Missing Google credentials in destination '${destinationName}'`);
        }

        // Authenticate with Google
        const oauth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uri || 'urn:ietf:wg:oauth:2.0:oob'
        );
        oauth2Client.setCredentials({ refresh_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Create folders and upload files
        const parentFolderId = await getOrCreateFolder(drive, 'Audit Logs');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const formatDate = (d) => d.toISOString().split('T')[0];
        const subFolderName = `AL_${formatDate(startDate)}_TO_${formatDate(endDate)}`;
        const subFolderId = await getOrCreateFolder(drive, subFolderName, parentFolderId);

        const uploadedFiles = [];

        for (const filePath of textFilePaths) {
            const fileName = path.basename(filePath);
            const fileMetadata = { name: fileName, parents: [subFolderId] };
            const media = { mimeType: 'text/plain', body: fs.createReadStream(filePath) };

            const file = await drive.files.create({
                requestBody: fileMetadata,
                media,
                fields: 'id, name, webViewLink, size'
            });

            console.log(`Uploaded: ${file.data.name}`);
            uploadedFiles.push({
                name: file.data.name,
                id: file.data.id,
                link: file.data.webViewLink,
                size: file.data.size
            });
        }

        console.log(`Uploaded ${uploadedFiles.length} files to Google Drive`);
        console.log('---End of Uploading to Google Drive---');
        return uploadedFiles;

    } catch (error) {
        console.error(`Upload error: ${error.message}`);
        throw error;
    }
}

async function getOrCreateFolder(drive, folderName, parentFolderId = null) {
    const query = parentFolderId
        ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const res = await drive.files.list({ q: query, fields: 'files(id, name)' });
    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    }

    const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentFolderId) metadata.parents = [parentFolderId];

    const folder = await drive.files.create({ requestBody: metadata, fields: 'id' });
    return folder.data.id;
}
