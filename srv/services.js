const processReqHeader = require('./lib/processReqHeader');
const retrieveAuditLogs = require('./lib/retrieveAuditLogs');
const convertToText = require('./lib/convertToText');
const uploadToDrive = require('./lib/uploadToDrive');
const sendEmail = require('./lib/sendEmail');

module.exports = (srv) => {
    srv.on('retrieveAuditLogs', async (req) => {
        const isJob = await processReqHeader(req);
        
        const auditLogData = await retrieveAuditLogs();
        
        const textFilePath = await convertToText(auditLogData);

        await uploadToDrive(textFilePath);
        
        const result = await sendEmail(textFilePath);
        
        // if (!isJob) {
            return result;
        // }
    });
}