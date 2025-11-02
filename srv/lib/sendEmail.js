module.exports = sendEmail;
const SapCfMailer = require("sap-cf-mailer").default;
const fs = require('fs');
const path = require('path');

async function sendEmail(textFilePath) {
    console.log('---Begin Sending Email---');

    try {
        const transporter = new SapCfMailer("MAIL_DESTINATION");

        const today = new Date(); // Today
        today.setHours(0, 0, 0, 0); // Today at 00:00:00
        const endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // one day before today
        const startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)); // 6 days ago from endDate
        const formatDate = (date) => date.toISOString().split('T')[0];  // Format Date only 

        const totalFiles = textFilePath.length;

        // Send each file as a separate email due to message size limit
        for (let i = 0; i < totalFiles; i++) {
            const filePath = textFilePath[i];
            const fileName = path.basename(filePath);

            await transporter.sendMail({
                to: "ppg180825@gmail.com", // Change to your recipient
                subject: `Audit Log Retrieval from ${formatDate(startDate)} to ${formatDate(endDate)} - Part ${i + 1} of ${totalFiles}`,
                html: `
                    <h2>Audit Log Retrieval from ${formatDate(startDate)} to ${formatDate(endDate)}</h2>
                    <p>The audit log retrieval has been completed successfully.</p>
                    <p>This is part ${i + 1} of ${totalFiles} total files.</p>
                    <p>Please find the audit logs in the attached text file.</p>
                    <p>This is an automated email from the SAP BTP Audit Log System.</p>
                `,
                attachments: [
                    {
                        filename: fileName,
                        path: filePath
                    }
                ]
            });
            
            console.log(`Email ${i + 1} sent successfully`); 

            // Clean up the temp file after sending
            try {
                fs.unlinkSync(filePath);
                console.log(`Temporary file ${i + 1} deleted`);
            } catch (cleanupError) {
                console.warn('Could not delete temporary file:', cleanupError.message);
            }
        }
        console.log(`Email ${totalFiles} sent successfully`);
        console.log('---End Sending Email---');

        return [`Email sent successfully with audit log report attachments (Total ${totalFiles} emails)`];

    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw error;
    }
}