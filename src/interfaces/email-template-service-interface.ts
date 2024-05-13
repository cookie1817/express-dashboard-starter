export interface ISendMailParams {
    from: string;
    to: string;
    subject: string;
    template: string;
    'h:X-Mailgun-Variables': Record<string, unknown>;
}