module.exports = sendEmail;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function sendEmail(textFilePaths) {
    console.log('---Begin of Sending Email---');
    
    try {
        let nodemailer;
        try {
            nodemailer = require('nodemailer');
        } catch (error) {
            throw new Error('Nodemailer module not found. Please install it with: npm install nodemailer');
        }
        
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
        
        await transporter.verify();
        console.log('SMTP connection verified successfully');
        
        const totalFiles = textFilePaths.length;
        
        // Send each file as a separate email due to message size limit
        for (let i = 0; i < totalFiles; i++) {
            const filePath = textFilePaths[i];
            const fileName = path.basename(filePath);
            
            const today = new Date(); // Today
            today.setHours(0, 0, 0, 0); // Today at 00:00:00
            const endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // one day before today
            const startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)); // 6 days ago from endDate
            const formatDate = (date) => date.toISOString().split('T')[0];  // Format Date only 

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_TO,
                subject: `Audit Log Retrieval from ${formatDate(startDate)} to ${formatDate(endDate)} - Part ${i + 1} of ${totalFiles}`,
                html: `
                    <html>
                        <body>
                            <h2>Audit Log Retrieval from ${formatDate(startDate)} to ${formatDate(endDate)}</h2>
                            <p>The audit log retrieval has been completed successfully.</p>
                            <p>This is part ${i + 1} of ${totalFiles} total files.</p>
                            <p>Please find the audit logs in the attached text file.</p>
                        </body>
                    </html>
                `,
                attachments: [
                    {
                        filename: fileName,
                        path: filePath
                    }
                ]
            };
            
            try {
                const info = await transporter.sendMail(mailOptions);
                console.log(`Email ${i + 1} sent successfully`);
                
            } catch (emailError) {
                console.log(`Error sending email ${i + 1}: ${emailError.message}`);
            }
            
            // Clean up the file after sending
            try {
                fs.unlinkSync(filePath);
                console.log(`Temporary file deleted: ${fileName}`);
            } catch (cleanupError) {
                console.log(`Error deleting file ${fileName}: ${cleanupError.message}`);
            }
        }
        
        console.log('---End of Sending Email---');
        return [`Email sent successfully to ${process.env.EMAIL_TO} - ${totalFiles} emails`];
    } catch (error) {
        console.log(`Error during email sending: ${error.message}`);
        
        // Clean up file even if email fails
        try {
            textFilePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        } catch (cleanupError) {
            console.log(`Error during file cleanup: ${cleanupError.message}`);
        }
        
        throw error;
    }
}