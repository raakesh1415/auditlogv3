const processReqHeader = require('./lib/processReqHeader');
const retrieveAuditLogs = require('./lib/retrieveAuditLogs');
const convertToText = require('./lib/convertToText');
const sendEmail = require('./lib/sendEmail');
const uploadToDrive = require('./lib/uploadToDrive');

module.exports = (srv) => {
    srv.on('retrieveAuditLogs', async (req) => {
        // const isJob = await processReqHeader(req);
        const auditLogData = await retrieveAuditLogs();
        const textFilePaths = await convertToText(auditLogData);
        const driveUpload = await uploadToDrive(textFilePaths);
        const result = await sendEmail(textFilePaths);
        
        return result;
    });
}