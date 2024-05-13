import formData from 'form-data';
import Mailgun, { Interfaces, MessagesSendResult, MailgunMessageData } from 'mailgun.js';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { ISendMailParams } from 'src/interfaces';
import { 
    EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD,
    EMAIL_SERVER_PORT,
    EMAIL_SERVER_HOST,
    EMAIL_FROM,
    EMAIL_SERVER_API_KRY,
    EMAIL_SERVER_DOMAIN
  } from 'src/config';

export interface IMailGunClient {
    sendMail(emailRequest: MailgunMessageData): Promise<MessagesSendResult>
}

export class MailGunClient implements IMailGunClient {

    private mg: Interfaces.IMailgunClient;

    private domain: string;
    
    private apiKey: string;

    public constructor() {
        this.domain = EMAIL_SERVER_DOMAIN;
        this.apiKey = EMAIL_SERVER_API_KRY;
        this.mg = new Mailgun(formData).client({
            username: 'api',
            key: this.apiKey,
        });
    }

    public async sendMail(emailRequest: MailgunMessageData): Promise<MessagesSendResult> {
        try {
            const response = await this.mg.messages.create(this.domain, emailRequest)
            return response;
        } catch (err) {
            throw new StandardError(ErrorCodes.SEND_EMAIL_ERROR, err);
        }
    }
}
