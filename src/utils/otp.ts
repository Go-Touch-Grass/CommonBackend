import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Utility function to generate a 6-digit OTP
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
    console.log("Email user: ", process.env.EMAIL_USER);
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Example using Gmail, you can configure this for your provider
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },

    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'GoTouchGrass - Your OTP for Email Verification',
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
}

// Send OTP via email
export async function sendSubscriptionRenewEmail(email: string, daysLeft: number): Promise<void> {
    console.log("Email user: ", process.env.EMAIL_USER);
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Example using Gmail, you can configure this for your provider
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },

    });

    //const subscriptionLink = `${process.env.BASE_URL}/viewSubscriptionPage`;
    const subscriptionLink = `${process.env.BASE_URL}/viewSubscriptionPage`;

    // email content based on daysLeft
    const emailContent = daysLeft === 0
        ? `<p>Your subscription expires <strong>today</strong>.</p>`
        : `<p>Your subscription is about to expire in <strong>${daysLeft} days</strong>.</p>`;


    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'GoTouchGrass - Subscription about to expire ',
        html: `
         ${emailContent}
        <p>Please renew your subscription to continue using our services.</p>
        <p><a href="${subscriptionLink}" style="color: #1a73e8; text-decoration: none;">Click here to view your subscription</a></p>
    `,
    };
    await transporter.sendMail(mailOptions);
}
