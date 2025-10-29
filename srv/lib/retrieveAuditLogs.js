module.exports = retrieveAuditLogs;
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

async function retrieveAuditLogs() {
    console.log('---Begin Retrieving Audit Logs---');

    const allAuditLogs = [];

    // Set one day time
    const endTime = new Date();
    endTime.setHours(0, 0, 0, 0); // Start today
    const startTime = new Date(endTime.getTime() - ((24 * 60 * 60 * 1000) * 7)); // Start 7 days ago
    
    const timeFrom = startTime.toISOString().split('.')[0];   // format YYYY-MM-DDTHH24:MI:SS
    const timeTo = endTime.toISOString().split('.')[0];   // format YYYY-MM-DDTHH24:MI:SS
    
    console.log(`Fetching audit logs from ${timeFrom} to ${timeTo}`);

    let handle = null;
    let pageNumber = 1;

    try {
        while (true) {
            let url = `/auditlog/v2/auditlogrecords?time_from=${timeFrom}&time_to=${timeTo}`;
            if (handle) url += `&handle=${encodeURIComponent(handle)}`;

            console.log(`Retrieving page ${pageNumber}...`);

            const response = await executeHttpRequest(
                { destinationName: 'AUDITLOG_DESTINATION' },
                {
                    method: 'GET',
                    url,
                    headers: { 'content-type': 'application/json' }
                }
            );

            const records = response.data || [];
            console.log(`Page ${pageNumber}: Retrieved ${records.length} records`);
            allAuditLogs.push(...records);

            // Check if a next page handle exists
            const pagingHeader = response.headers?.paging;
            if (!pagingHeader) break;

            const match = pagingHeader.match(/handle=([^;,\s]+)/);
            handle = match ? match[1] : null;
            if (!handle) break;

            pageNumber++;
            if (pageNumber > 100) {
                console.warn('Reached maximum page limit (100). Stopping pagination.');
                break;
            }
        }

        console.log(`Total audit logs retrieved: ${allAuditLogs.length}`);
        console.log('---End Retrieving Audit Logs---');
        return allAuditLogs;

    } catch (error) {
        console.error(`Error retrieving audit logs: ${error.message}`);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}
