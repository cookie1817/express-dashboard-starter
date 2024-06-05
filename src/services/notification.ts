import { User } from '@prisma/client';

import {  MailDataRequired } from "@sendgrid/mail";
import { MailGunClient } from 'src/client/mailgun';
import { SendGridClient } from 'src/client/sendgrid';

export class NotificationService {
    private readonly mailgunClient: MailGunClient;

    private readonly sendGridClient: SendGridClient;

    public constructor(mailgunClient: MailGunClient, sendGridClient: SendGridClient) {
        this.mailgunClient = mailgunClient;
        this.sendGridClient = sendGridClient;
    }

    async sendOtpCodeEmail(user: User): Promise<boolean> {
        try {
            const sendMailParams: MailDataRequired = {
                from: 'poll5404@gmail.com',
                to: user.email,
                subject: "Inspectify Hub Inc - Email OTP Verification",
                templateId: "d-de1b74ede9ea46b9b120fb7700fa682f",
                dynamicTemplateData: {
                    otp_code: user.emailOtpCode,
                    user_name: user.name
                }
            }

            await this.sendGridClient.sendMail(sendMailParams);
    
            return true
        } catch (err) {
            console.log('error', err)
        }
    }

    async sendResetPasswordEmail(user: User, resetUrl: string): Promise<boolean> {
        try {
            const sendMailParams: MailDataRequired = {
                from: 'poll5404@gmail.com',
                to: user.email,
                subject: "Inspectify Hub Inc - Password reset",
                templateId: "d-056a4c49d53e45749239bae15dbe941e",
                dynamicTemplateData: {
                    reset_url: resetUrl
                }
            }

            await this.sendGridClient.sendMail(sendMailParams);
    
            return true
        } catch (err) {
            console.log('error', err)
        }
    }

}