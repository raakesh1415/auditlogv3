module.exports = retrieveAuditLogs;
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function retrieveAuditLogs() {
    console.log('---Begin of Retrieving Audit Logs---');
    
    try {
        // Get OAuth access token
        const accessToken = await getAccessToken();
        console.log('Access token retrieved successfully');
        // console.log(accessToken)
        
        // Retrieve audit logs with pagination
        const auditLogs = await fetchAuditLogsWithPagination(accessToken);
        console.log(`Retrieved ${auditLogs.length} audit log records`);
        
        // console.log(auditLogs)
        console.log('---End of Retrieving Audit Logs---');
        return auditLogs;
    } catch (error) {
        console.log(`Error during audit log retrieval: ${error.message}`);
        throw error;
    }
}

async function getAccessToken() {
    const certPath = path.join(__dirname, '../../mtls-certificate.pem');
    const keyPath = path.join(__dirname, '../../mtls-private-key.pem');
    
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    
    const postData = `grant_type=client_credentials&client_id=${process.env.UAA_CLIENT_ID}`;
    
    const options = {
        hostname: process.env.UAA_CERT_URL.replace('https://', '').split('/')[0],
        path: '/oauth/token',
        method: 'POST',
        cert: cert,
        key: key,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.access_token);
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function fetchAuditLogsWithPagination(accessToken) {
    let allLogs = [];
    
    // Set one day time
    const endTime = new Date();
    endTime.setHours(0, 0, 0, 0); // Start today
    const startTime = new Date(endTime.getTime() - ((24 * 60 * 60 * 1000) * 7)); // Start 7 days ago
    
    const timeFrom = startTime.toISOString().split('.')[0];   // format YYYY-MM-DDTHH24:MI:SS
    const timeTo = endTime.toISOString().split('.')[0];   // format YYYY-MM-DDTHH24:MI:SS
    
    console.log(`Fetching audit logs from ${timeFrom} to ${timeTo}`);
    
    let handle = null;
    let pageCount = 0;
    
    // Loop through all pages using handle
    while (true) {
        pageCount++;
        const result = await fetchAuditLogsPage(accessToken, timeFrom, timeTo, handle);
        
        console.log(`Page ${pageCount}: Retrieved ${result.data.length} records`);
        
        if (result.data && result.data.length > 0) {
            allLogs = allLogs.concat(result.data);
            console.log(`Total records so far: ${allLogs.length}`);
        }
        
        // Check for next page handle in response headers
        if (result.handle) {
            console.log(`Next page handle found, continuing pagination...`);
            handle = result.handle;
        } else {
            console.log(`No more pages available`);
            break;
        }

    }
    
    return allLogs;
}

async function fetchAuditLogsPage(accessToken, timeFrom, timeTo, handle) {
    const auditLogUrl = new URL(process.env.AUDIT_LOG_URL);
    
    // Build URL path with paging handle parameter
    let urlPath = `/auditlog/v2/auditlogrecords?time_from=${timeFrom}&time_to=${timeTo}`;
    if (handle) {
        urlPath += `&handle=${encodeURIComponent(handle)}`;
    }
    
    // console.log(`Fetching: ${urlPath.substring(0, 100)}...`);
    
    const options = {
        hostname: auditLogUrl.hostname,
        path: urlPath,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    // Parse response as a direct array
                    let response;
                    try {
                        response = JSON.parse(data);
                    } catch (parseError) {
                        console.log(`Error parsing JSON: ${parseError.message}`);
                        console.log(`Response data: ${data.substring(0, 500)}`);
                        reject(parseError);
                        return;
                    }
                    
                    let records = [];
                    if (Array.isArray(response)) {
                        records = response;
                    }
                    
                    // Extract handle from response headers for pagination
                    const pagingHeader = res.headers['paging'];
                    let nextHandle = null;
                    
                    if (pagingHeader) {
                        // console.log(`Paging header: ${pagingHeader.substring(0, 100)}...`);
                        const handleMatch = pagingHeader.match(/handle=([^;,\s]+)/);
                        if (handleMatch && handleMatch[1]) {
                            nextHandle = handleMatch[1];
                        }
                    }
                    
                    resolve({
                        data: records,
                        handle: nextHandle
                    });
                } catch (error) {
                    console.log(`Error processing response: ${error.message}`);
                    console.log(`Response data: ${data.substring(0, 500)}`);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`Request error: ${error.message}`);
            reject(error);
        });
        
        req.end();
    });
}