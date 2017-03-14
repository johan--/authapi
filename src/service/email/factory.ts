'use strict'
import { IEmailService } from "./interface/email";
import { SMTPEmailService } from "./impl/smtp/email";

export class EmailServiceFactory {
    /**
     * get email service
     * @static
     * @returns {IEmailService}
     * 
     * @memberOf EmailServiceFactory
     */
    public static getEmailService() : IEmailService {
       return new SMTPEmailService();
    }
}