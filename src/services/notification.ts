import { User } from '@prisma/client';
import { MailgunMessageData } from 'mailgun.js';

import {  MailDataRequired } from "@sendgrid/mail";
import { MailGunClient } from 'src/client/mailgun';
import { SendGridClient } from 'src/client/sendgrid';


import { SERVER_URL, EMAIL_FROM } from 'src/config';

export class NotificationService {
    private readonly mailgunClient: MailGunClient;

    private readonly sendGridClient: SendGridClient;

    public constructor(mailgunClient: MailGunClient, sendGridClient: SendGridClient) {
        this.mailgunClient = mailgunClient;
        this.sendGridClient = sendGridClient;
    }

    async sendVerificationEmail(user: User): Promise<boolean> {
        try {
            const emailVerificationUrl = `${SERVER_URL}/api/v1/auth/verfifyEmail/${user.id}?email_code=${user.emailCode}`
            const sendMailParams: MailDataRequired = {
                from: 'poll5404@gmail.com',
                to: user.email,
                subject: "Verify your email",
                templateId: "d-cc11a9decfd04388952bbee07d5c4651",
                dynamicTemplateData: {
                    email_verification_url: emailVerificationUrl,
                    user_name: user.name
                }
            }

            await this.sendGridClient.sendMail(sendMailParams);
    
            return true
        } catch (err) {
            console.log('error', err)
        }
    }

}