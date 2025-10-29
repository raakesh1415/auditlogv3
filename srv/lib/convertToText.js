module.exports = convertToText;
const fs = require('fs');
const path = require('path');

async function convertToText(auditLogData) {
    console.log('---Start of Converting JSON Audit Logs to Text Format---');
    
    try {
        const RECORDS_PER_FILE = 8000; // one txt file with 8000 records (file size around 20 MB)
        const totalRecords = auditLogData.length;
        const numberOfFiles = Math.ceil(totalRecords / RECORDS_PER_FILE);
        const filePaths = [];
        
        for (let i = 0; i < numberOfFiles; i++) {
            const start = i * RECORDS_PER_FILE;
            const end = Math.min(start + RECORDS_PER_FILE, totalRecords);
            const chunk = auditLogData.slice(start, end);
            
            const fileName = `audit_logs_part_${i + 1}_of_${numberOfFiles}.txt`;
            const filePath = path.join(__dirname, '../../', fileName);
            
            // Convert chunk to JSON string format
            const textContent = JSON.stringify(chunk, null, 2);
            
            // Write to file
            fs.writeFileSync(filePath, textContent, 'utf8');
            filePaths.push(filePath);
            
            console.log(`Created ${fileName} with ${chunk.length} records (${start + 1}-${end})`);
        }
        
        console.log('---End of Converting JSON Audit Logs to Text Format---');
        return filePaths;
    } catch (error) {
        console.log(`Error during text conversion: ${error.message}`);
        throw error;
    }
}