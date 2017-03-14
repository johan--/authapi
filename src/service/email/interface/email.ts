'use strict'
import { User } from "../../../model/entity/user";

/**
 * @export
 * @interface IEmailService
 */
export interface IEmailService {
	sendRegistrationMail(user: User): void;
	sendRegistrationConfirmationMail(user: User): void;
	sendPasswordChangeMail(user: User): void;
	sendForgetPasswordMail(user: User): void;
}