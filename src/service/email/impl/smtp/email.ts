'use strict'
import { IEmailService } from "../../interface/email";
import { User } from "../../../../model/entity/user";
import { BasicCredential } from '../../../../model/entity/basic-credential';
import { Logger } from '../../../../util/logger';
import ApplicationConfig = require("../../../../config/application-config");

let nodeMailer = require('nodemailer');
var path = require('path');
let EmailTemplate = require('email-templates').EmailTemplate;

const log = new Logger('SMTPEmailService');

var transporter = nodeMailer.createTransport(ApplicationConfig.SMTP_HOST);
var templatesDir = path.resolve(__dirname, '../../../../public', 'templates')

export class SMTPEmailService implements IEmailService {
    /**
     * Send registration email
     * 
     * @param {User} user
     * 
     * @memberOf SMTPEmailService
     */
    sendRegistrationMail(user: User): void {
        log.debug("sendRegistrationMail - user:" + user.username);
        var template = new EmailTemplate(path.join(templatesDir, 'registrationEmail'))
        var locals = {
            emailTo: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            verificationToken: user.registrationVerificationToken,
            appBaseURL: ApplicationConfig.REDIRECT_CONFIG.identity_ui_base_url
        }

        template.render(locals, function (err: Error, results: any) {
            if (err) {
                return console.error(err)
            }
            transporter.sendMail({
                from: ApplicationConfig.FROM_EMAIL,
                to: locals.emailTo,
                subject: 'Registration Success',
                html: results.html
            }, function (err: Error, responseStatus: any) {
                if (err) {
                    log.error(err.message, err);
                }
                log.debug(responseStatus);
            })
        });
    }

    /**
     * Send registration confirmation email
     * 
     * @param {User} user
     * 
     * @memberOf SMTPEmailService
     */
    sendRegistrationConfirmationMail(user: User): void {
        log.debug("sendRegistrationConfirmationMail - user:" + user.username);
        var emailTo = user.email;
        var mailOptions = {
            from: ApplicationConfig.FROM_EMAIL, // sender address 
            to: emailTo, // list of receivers 
            subject: 'Verification sucessful', // Subject line
            text: "Your account has been verified sucessfully.",
            html: "Your account has been verified sucessfully." // html body 
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error: Error, info: any) {
            if (error) {
                log.error(error.message, error);
            }
            log.debug('Info: '+ JSON.stringify(info));
            log.debug('Message sent: ' + info.response);
        });
    }

    /**
     * send password changed email
     * 
     * @param {User} user
     * 
     * @memberOf SMTPEmailService
     */
    sendPasswordChangeMail(user: User): void {
        log.debug("sendPasswordChangeMail - user:" + user.username);
        var emailTo = user.email;
        var mailOptions = {
            from: ApplicationConfig.FROM_EMAIL, // sender address 
            to: emailTo, // list of receivers 
            subject: 'Password update sucessful', // Subject line
            text: "Your account password has been updated sucessfully.",
            html: "Your account password has been updated sucessfully." // html body 
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error: Error, info: any) {
            if (error) {
                log.error(error.message, error);
            }
            log.debug('Info: '+ JSON.stringify(info));
            log.debug('Message sent: ' + info.response);
        });
    }

    /**
     * send forgot password email
     * 
     * @param {User} user
     * 
     * @memberOf SMTPEmailService
     */
    sendForgetPasswordMail(user: User): void {
        log.debug("sendForgetPasswordMail - to email:" + user.email);

        let userCredential = <BasicCredential>user.credential;

        var template = new EmailTemplate(path.join(templatesDir, 'resetPasswordEmail'))
        log.debug("template: " + template);
        var locals = {
            emailAddress: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            appBaseURL: ApplicationConfig.REDIRECT_CONFIG.identity_ui_base_url,
            resetLink: ApplicationConfig.REDIRECT_CONFIG.identity_ui_base_url + '#/reset-password?verify=true&user=' + user.email + '&token=' + userCredential.resetPasswordToken
        }

        template.render(locals, function (err: Error, results: any) {
            if (err) {
                log.error(err.message, err);
            }
          
            transporter.sendMail({
                from: ApplicationConfig.FROM_EMAIL,
                to: locals.emailAddress,
                subject: 'Reset your password on Taylor & Francis',
                html: results.html
            }, function (err: Error, responseStatus: any) {
                if (err) {
                    log.error(err.message, err);
                }
                log.debug(responseStatus);
            })
        });
    }
}