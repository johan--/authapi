'use strict'

import * as Q from 'q';
import { Request, Response } from "express";
import { User } from "../../../model/entity/user";

/**
 * @export
 * @interface IAuthService
 */
export interface IAuthService {
    registerUser(user: User, info: any): Q.Promise<User>;
    verifyRegistration(username : string, registrationVerificationToken : string, userClientInfo : any) : Q.Promise<User>;
    loginUserByBasicCredential(user: User, info: any, userClientInfo : any) : Q.Promise<User>
    loginByIp(ipuser : User) : Q.Promise<any>;
    loginOrRegisterUserByOrcid(tnfClientId : string, userClientInfo : any, isAuthorizationFlow : boolean, err: Error, user: User, info: any): Q.Promise<any>;
    logoutUser(idToken: string) : Q.Promise<any>;
    generateForgotPasswordToken(username : string) : Q.Promise<any>;
    verifyForgotPasswordToken(username : string, resetPasswordToken : string) : Q.Promise<boolean>;
    resetPassword(username : string, newPassword : string, resetPasswordToken : string) : Q.Promise<boolean>;
    updatePassword(username : string, newPassword : string, oldPassword : string) : Q.Promise<User>;
    validateAccessToken(clientIp : string, idToken: string) : Q.Promise<any>;
    registerOrLoginSocialMedia(socialMediaName : string, isAuthorizationFlow : boolean, user: User, userClientInfo : any) : Q.Promise<User>;//facebook or twitter or linkedIn or Google
}