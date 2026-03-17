const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
    try {
        console.log(`Attempting to send OTP email to ${to} using ${process.env.EMAIL_USER}...`);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"AgroVision" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[CRITICAL ERROR] Failed to send email via NodeMailer.');
        console.error('Error Code:', error.code);
        console.error('Error Command:', error.command);
        console.error('Full Error Object:', error);
        return false;
    }
};

module.exports = sendEmail;
