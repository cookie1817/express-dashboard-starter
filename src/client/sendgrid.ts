import { Client } from "@sendgrid/client";
import sgMail, { MailService, ClientResponse, MailDataRequired } from "@sendgrid/mail";
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { SENDGRID_API_KEY } from 'src/config';
export interface ISendGridClient {
    sendMail(emailRequest: MailDataRequired): Promise<ClientResponse>
}

export class SendGridClient implements ISendGridClient {
    private sgMail: MailService;
    
    private apiKey: string;

    public constructor() {
        this.apiKey = SENDGRID_API_KEY;
        this.sgMail = sgMail;
        this.sgMail.setClient(new Client());
        this.sgMail.setApiKey(this.apiKey);
    }

    public async sendMail(emailRequest: MailDataRequired): Promise<any> {
        try {
            sgMail.send(emailRequest).then(
                (response) => {
                    return response
                },
                (error) => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body);
                    }
                }
            );
        } catch (err) {
            throw new StandardError(ErrorCodes.SEND_EMAIL_ERROR, err);
        }
    }
}