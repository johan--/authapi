'use strict'

import { Request, Response } from "express";

export interface IAuthController {
	registerUser(request: Request, response: Response): void;
	verifyRegistration(request: Request, response: Response, next : any): void;
	loginUserByBasicCredential(request: Request, response: Response): void;
	loginOrRegisterUserByOrcid(request: Request, response: Response): void;
	getOrcidLogin(request: Request, response: Response): void;
	loginByIp(request: Request, response: Response): void;
	logoutUser(request: Request, response: Response): void;
	generateForgotPasswordToken(request: Request, response: Response): void;
	verifyForgotPasswordToken(request: Request, response: Response): void;
	resetPassword(request: Request, response: Response): void;
	updatePassword(request: Request, response: Response): void;
	validateAccessToken(request: Request, response: Response): void;
	getFacebookLogin(request: Request, response: Response): void;
	loginOrRegisterUserByFacebook(request: Request, response: Response): void;
	getTwitterLogin(request: Request, response: Response): void;
	loginOrRegisterUserByTwitter(request: Request, response: Response): void;
	getLinkedinLogin(request: Request, response: Response): void;
	loginOrRegisterUserByLinkedin(request: Request, response: Response): void;
	getGoogleLogin(request: Request, response: Response): void;
	loginOrRegisterUserByGoogle(request: Request, response: Response): void;
	token(request: Request, response: Response): void;
	authorize(request: Request, response: Response): void;
	consent(request: Request, response: Response): void;
}