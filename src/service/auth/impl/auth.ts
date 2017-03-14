'use strict'
import * as Q from "q";
import { Request, Response } from "express";
import { DaoFactory } from "../../../model/dao/factory";
import { IUserDao } from "../../../model/dao/interface/user-dao";
import { IAccessDao } from "../../../model/dao/interface/access-dao";
import { IClientDao } from "../../../model/dao/interface/client-dao";
import { User } from "../../../model/entity/user";
import { Access } from "../../../model/entity/access";
import { Client } from "../../../model/entity/client";
import { BasicCredential } from "../../../model/entity/basic-credential";
import { IAuthService } from "../interface/auth";
import { IEmailService } from "../../email/interface/email";
import { IAccessService } from "../../access/interface/access";
import { Logger } from '../../../util/logger';
import { Helper } from '../../../util/helper';
import { EncryptionUtil } from '../../../util/encryption';
import { SessionManager, SessionKeys } from '../../../util/session';
import { ITokenManager } from '../../../token/interface/tokenmanager';
import { IpStrategy } from "../../passport/ip-strategy";
import { SocialStrategy } from "../../passport/social-strategy";
import ApplicationConfig = require("../../../config/application-config");

const log = new Logger('AuthService');

export class AuthService implements IAuthService {

	passport: any;
	userDao: IUserDao;
	clientDao: IClientDao;
	accessDao: IAccessDao
	emailService: IEmailService;
	accessService: IAccessService;
    tokenManager: ITokenManager;
	ipStrategy: IpStrategy;
	socialStrategy: SocialStrategy;

    constructor(passport: any, emailService: IEmailService, accessService: IAccessService, daoFactory: DaoFactory, tokenManager: ITokenManager) {
		this.passport = passport;
		this.accessService = accessService;
		this.emailService = emailService;
		this.tokenManager = tokenManager;
		this.userDao = daoFactory.getUserDao();
		this.clientDao = daoFactory.getClientDao();
		this.accessDao = daoFactory.getAccessDao();
		this.ipStrategy = new IpStrategy(daoFactory); 
		this.socialStrategy = new SocialStrategy(daoFactory);
    }

	/**
	 * 
	 * 
	 * @param {User} user
	 * @param {*} info
	 * @returns {Q.Promise<User>}
	 * 
	 * @memberOf AuthService
	 */	
    registerUser(user: User, info: any): Q.Promise<User> {
		log.debug("registerUser: user : " + JSON.stringify(user));
		log.debug("registerUser: info : " + info);
        let deferred : Q.Deferred<any> = Q.defer();
		if (!user) {
			deferred.reject(info);
		} else {
			user.credential = null;
			user.accessToken = null;
			this.emailService.sendRegistrationMail(user);
			deferred.resolve(user);
		}

		return deferred.promise;
	}

	//Update session----------------------------------------
	/**
	 * 
	 * 
	 * @param {string} username
	 * @param {string} registrationVerificationToken
	 * @param {*} userClientInfo
	 * @returns
	 * 
	 * @memberOf AuthService
	 */
	verifyRegistration(username : string, registrationVerificationToken : string, userClientInfo : any) : Q.Promise<User> {
		log.debug("verifyRegistration: username : " + username + ", verifyT : " + registrationVerificationToken);
        let deferred : Q.Deferred<any> = Q.defer();

		if ((username && username!== '' && username !== null) && (registrationVerificationToken && registrationVerificationToken !== '' && registrationVerificationToken !== null)) {
			this.userDao.getUserByUserName(username.toLowerCase())
			.then((user : User) => {
				if(user) {
					if (new Date().getTime() > user.registrationVerificationTokenExpiry) {						
						log.debug("verifyRegistration : Token expired")
						deferred.reject({ status : 409, key: "VERIFICATION_CODE", value: "Verification code is incorrect." });
					} else if (user.registrationVerificationToken === registrationVerificationToken) {
						this.userDao.updateUser(user.id, { registrationVerificationToken: null, isValidated: true })
						.then((updatedUser : User) => { 
							return this.accessService.createUserAccessToken(updatedUser.username, updatedUser.userType, userClientInfo, updatedUser);
						})
						.then((userWithAccess : User) => {
							this.emailService.sendRegistrationConfirmationMail(userWithAccess);
							deferred.resolve(userWithAccess);
						})
						.fail((err : Error) => { deferred.reject(err); })
        				.done();
					}
				} else {
					log.debug("verifyRegistration : token mismatch");
					deferred.reject({ status : 409, key: "VERIFICATION_CODE", value: "Verification code is incorrect." });
				}
			})
			.fail((err : Error) => { deferred.reject(err); })
        	.done();
		}
		return deferred.promise;
	}

	/**
	 * 
	 * 
	 * @param {User} user
	 * @param {*} info
	 * @param {*} userClientInfo
	 * @returns {Q.Promise<User>}
	 * 
	 * @memberOf AuthService
	 */
	loginUserByBasicCredential(user: User, info: any, userClientInfo : any) : Q.Promise<User> {
		log.debug("loginUserByBasicCredential: ");
        let deferred : Q.Deferred<any> = Q.defer();

		if (!user) {
			deferred.reject(info);
		} else {
			this.accessService.createUserAccessToken(user.username, user.userType, userClientInfo, user)
			.then((userWithAccess : User) => { deferred.resolve(userWithAccess);})
			.fail((err : Error) => { deferred.reject(err); })
			.done();
		}

		return deferred.promise;
	}

	/**
	 * 
	 * 
	 * @param {User} ipuser
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf AuthService
	 */
	loginByIp(ipuser : User) : Q.Promise<any> {
		log.debug("loginByIp");
        let deferred : Q.Deferred<any> = Q.defer();
		
		if (!ipuser) {
			deferred.resolve({ access_type : "allow", user : null });
		} else {
			log.debug("user: ", ipuser);
			this.ipStrategy.registerOrLoginIpUser(ipuser)
			.then((newUser : User) => {
				if(newUser.isValidated) {
					this.accessService.createUserAccessToken(newUser.username, newUser.userType, Helper.getUserClientInfo(request), newUser)
					.then((userWithAccess : User) => {
						deferred.resolve({ access_type : "allow", user : userWithAccess });
					})
					.fail((err : Error) => { deferred.reject(err); }).done();
				} else {
					deferred.reject(new Error("token is not valid."));
				}
			})
			.fail((err : Error) => { deferred.reject(err); }).done();
		}

		return deferred.promise;
    }
	
	/**
	 * 
	 * 
	 * @param {string} tnfClientId
	 * @param {*} userClientInfo
	 * @param {boolean} isAuthorizationFlow
	 * @param {Error} err
	 * @param {User} user
	 * @param {*} info
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf AuthService
	 */
	loginOrRegisterUserByOrcid(tnfClientId : string, userClientInfo : any, isAuthorizationFlow : boolean, err: Error, user: User, info: any): Q.Promise<any> {
		log.debug("loginOrRegisterUserByOrcid : tnfClientId : " + tnfClientId);
        let deferred : Q.Deferred<any> = Q.defer();

		if (tnfClientId) {
			let clientCallbackUrl = ApplicationConfig.ORCID_CONFIG.tnfClientUrls[tnfClientId];
			if (err) {
				deferred.resolve({ callbackURL : clientCallbackUrl + "?status=failure&error=" + err.message });
			}
			else if (!user) {
				deferred.resolve({ callbackURL : clientCallbackUrl + "?status=failure&error=nouserfound" });
			} else {
				this.socialStrategy.registerOrLoginSocialUser(user)
				.then((newUser : User) => {
					if (newUser.isValidated) {
						this.accessService.createUserAccessToken(newUser.username, newUser.userType, userClientInfo, newUser)
						.then((userWithAccess : User) => {
							deferred.resolve({ callbackURL : clientCallbackUrl + "?status=success&token=" + userWithAccess.accessToken[userWithAccess.accessToken.length - 1].token });
						})
						.fail((err : Error) => { deferred.resolve({ callbackURL : clientCallbackUrl + "?status=failure&error=" + err.message }); }).done();
					} else {
						deferred.resolve({ callbackURL : clientCallbackUrl + "?status=success&token=" + user.accessToken[user.accessToken.length - 1].token });
					}
				})
				.fail((err : Error) => { deferred.resolve({ callbackURL : clientCallbackUrl + "?status=failure&error=" + err.message }); }).done();
			}
		} else { 
			if (err) {
				deferred.reject(err);
			}
			else if (!user) {
				deferred.reject(info);
			} else {
				this.socialStrategy.registerOrLoginSocialUser(user)
				.then((newUser : User) => {
					if (newUser.isValidated && !isAuthorizationFlow) {
						this.accessService.createUserAccessToken(newUser.username, newUser.userType, userClientInfo, newUser)
						.then((userWithAccess : User) => {
							deferred.resolve({ error: err, user: userWithAccess });
						})
						.fail((err : Error) => {deferred.reject(err); }).done();
					}
				})
				.fail((err : Error) => { deferred.reject(err); }).done();
			}
		}
		return deferred.promise;
	}

	/**
	 * 
	 * 
	 * @param {string} idToken
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf AuthService
	 */
	logoutUser(idToken: string) : Q.Promise<any> {
		log.debug("logoutUser: ");
        let criteria = { idToken: idToken };
		return this.accessDao.findAccess(criteria).then((access: Array<Access>) => { return this.accessDao.removeAccess(criteria); });
	}

	/**
	 * 
	 * 
	 * @param {string} username
	 * @returns
	 * 
	 * @memberOf AuthService
	 */
	generateForgotPasswordToken(username : string) : Q.Promise<any> {
		log.debug("generateForgotPasswordToken : For user:" + username);
        let deferred : Q.Deferred<any> = Q.defer();
		let token: string = '';

		this.tokenManager.generateRandomToken()
		.then((randomToken : string) => {
			token = randomToken;
			return this.userDao.getUserByUserName(username.toLowerCase());
		})
		.then((user : User) => {
			if(user) {
				let credential = <BasicCredential>user.credential;
				credential.resetPasswordToken = token;
				this.userDao.updateUser(user.id, { credential: credential })
				.then((updatedUser: User) => {
					this.emailService.sendForgetPasswordMail(updatedUser);
					deferred.resolve();
				})
				.fail((err : Error) => { deferred.reject(err); }).done();
			}
		})
		.fail((err : Error) => { deferred.reject(err); }).done();
		
		return deferred.promise;
	}

	/**
	 * 
	 * 
	 * @param {string} username
	 * @param {string} resetPasswordToken
	 * @returns {Q.Promise<boolean>}
	 * 
	 * @memberOf AuthService
	 */
	verifyForgotPasswordToken(username : string, resetPasswordToken : string) : Q.Promise<boolean> {
		log.debug("verifyForgotPasswordToken : For user:" + username);
        let deferred : Q.Deferred<any> = Q.defer();

		this.userDao.getUserByUserName(username.toLowerCase())
		.then((user : User) => {
			if(user) {
				let credential = <BasicCredential>user.credential;
				if(credential.resetPasswordToken === resetPasswordToken) {
					deferred.resolve(true);
				} else {
					deferred.resolve(false);
				}
			} else {
				deferred.reject({ status : 404, key: "EMAIL_ADDRESS", value: "Email address is not registered." });
			}
		})
		.fail((err : Error) => { deferred.reject(err); }).done();
		
		return deferred.promise;
	}

	/**
	 * 
	 * 
	 * @param {string} username
	 * @param {string} newPassword
	 * @param {string} resetPasswordToken
	 * @returns {Q.Promise<boolean>}
	 * 
	 * @memberOf AuthService
	 */
	resetPassword(username : string, newPassword : string, resetPasswordToken : string) : Q.Promise<boolean> {
		log.debug("resetPassword : For user:" + username);
		let deferred : Q.Deferred<any> = Q.defer();

		this.userDao.getUserByUserName(username.toLowerCase())
		.then((user : User) => {
			if(user) {
				let credential = <BasicCredential>user.credential;
				if(credential.resetPasswordToken === resetPasswordToken) {
					let isPasswordValid: boolean = Helper.validatePassword(newPassword);
					console.log("isPasswordValid", isPasswordValid);
					if(isPasswordValid) {
						credential.password = EncryptionUtil.encrypt(newPassword);
						credential.resetPasswordToken = null;
						this.userDao.updateUser(user.id, { credential: credential })
						.then((updatedUser : User) => {
							this.emailService.sendPasswordChangeMail(updatedUser);
							deferred.resolve(true);
						})
						.fail((err : Error) => { deferred.reject(err); }).done();
					} else {
						deferred.reject({ status : 409, key: "NEW_PASSWORD", value: "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $)." });
					}
				} else {
					deferred.reject({ status : 401, key: "RESET_PASSWORD_TOKEN", value: "resetPasswordToken not validated" });
				}
			} else {
				deferred.reject({ status : 404, key: "EMAIL_ADDRESS", value: "User not found." });
			}
		})
		.fail((err : Error) => { deferred.reject(err); }).done();
		
		return deferred.promise;
	}

	/**
	 * 
	 * 
	 * @param {string} username
	 * @param {string} newPassword
	 * @param {string} oldPassword
	 * @returns {Q.Promise<User>}
	 * 
	 * @memberOf AuthService
	 */
	updatePassword(username : string, newPassword : string, oldPassword : string) : Q.Promise<User> {
		log.debug("updatePassword : For user:" + username);
        let deferred : Q.Deferred<any> = Q.defer();

		if (oldPassword === newPassword) {
			deferred.reject({ key: "NEW_PASSWORD", value: "This password is recently used. Please choose a different one." });
		} else {
			this.userDao.getUserByUserName(username.toLowerCase())
			.then((user : User) => {
				if(user) {
					let credential = <BasicCredential>user.credential;
					if (EncryptionUtil.validate(credential.password, oldPassword)) {
						let isPasswordValid: Boolean = Helper.validatePassword(newPassword);
						if (isPasswordValid) {
							credential.password = EncryptionUtil.encrypt(newPassword);
							this.userDao.updateUser(user.id, { credential: credential })
							.then((updatedUser : User) => {
								this.emailService.sendPasswordChangeMail(updatedUser);
								updatedUser.credential = null;
								deferred.resolve(updatedUser);
							})
							.fail((err : Error) => { deferred.reject(err); }).done();
						} else {
							deferred.reject({ status : 409, key: "NEW_PASSWORD", value: "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $)." });
						}
					} else {
						deferred.reject({ status : 409, key: "OLD_PASSWORD", value: "Password is incorrect." });
					}
				} else {
					deferred.reject({ status : 404, key: "EMAIL_ADDRESS", value: "User not found." });
				}
			})
			.fail((err : Error) => { deferred.reject(err); }).done();
		}
		return deferred.promise; 
	}

	/**
	 * 
	 * 
	 * @param {string} clientIp
	 * @param {string} idToken
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf AuthService
	 */
	validateAccessToken(clientIp : string, idToken: string) : Q.Promise<any> {
		log.debug("validateAccessToken, clientIp : " + clientIp);
		/**
		 * Here we are just decoding the token and not verifying it.
		 * This is here so that we can fetch the client based on whether the token has client or not.
		 * Since our secret key is client secret key. Passing true in jwt decode means noVerify is true.
		 */
        let deferred : Q.Deferred<any> = Q.defer();
		let decodedToken : any;
		let decodeTokenDeferred =  Q.defer();
		let decodeTokenPromise =  decodeTokenDeferred.promise

		
		this.tokenManager.decodeJwtToken(idToken, this.tokenManager.secret, false)
		.then((decodedTok : string) => { 
			decodedToken = decodedTok;
			decodeTokenDeferred.resolve();
		})
		.fail((err : Error) => { 
			log.debug("Invalid token.");
			decodeTokenDeferred.reject(err || "Invalid token"); 
		}).done();

		decodeTokenPromise.then(() : Q.Promise<any> => {
			log.debug("Decoded Token is : " + JSON.stringify(decodedToken));
			let fetchClientDeferred : Q.Deferred<any> = Q.defer();
			if(decodedToken.aud) {
				this.clientDao.getClientByClientId(decodedToken.aud)
				.then((client : Client) => { fetchClientDeferred.resolve(client); })
				.fail((err : Error) => { fetchClientDeferred.reject(err || "No Client With The Id Available"); }).done();
			}
			else {
				fetchClientDeferred.resolve(null);
			}
			return fetchClientDeferred.promise;
		})
		.then((client : any) : Q.Promise<any> => {
			log.debug("Fetch Access Token * Resolve With Both  Client And Access");
			/**
			 * Fetch Access Token
			 * Resolve With Both  Client And Access
			 */
			let fetchTokenDeferred : Q.Deferred<any> = Q.defer();
			this.accessDao.getToken({ idToken: idToken })
			.then((access: Access) => { fetchTokenDeferred.resolve({ client : client, access : access }); })
			.fail((err : Error) => { return fetchTokenDeferred.reject(err); }).done();

			return fetchTokenDeferred.promise;
		})
		.then((clientAndAccessInfo : any) => {
			/**
			 * Verify The Signature 
			 */
			let verifySignatureDeferred : Q.Deferred<any> = Q.defer();
			let clientSecret : string = null;
			if(clientAndAccessInfo.client) {
				log.debug("Verify The Signature. ClientId : " + clientAndAccessInfo.client.clientId);
				clientSecret = clientAndAccessInfo.client.clientSecret;
			}
			this.tokenManager.decodeJwtToken(idToken, this.tokenManager.secret, true)
			.then((decodedTok : string) => {  verifySignatureDeferred.resolve(clientAndAccessInfo); })
			.fail((err : Error) => { verifySignatureDeferred.reject({ status : 401, key: "INVALID_SIGNATURE", value: err || "Could Not Match Token Signature" }); }).done();

			return verifySignatureDeferred.promise;
		})
		.then((clientAndAccessInfo : any) => {
			/**
			 * Update Expiry Time For The Token
			*/
			let updateTokenDeferred : Q.Deferred<any> = Q.defer();

			this.userDao.validateAndUpdateAuthToken(idToken, Helper.getNewExpirationTime())
			.then((result : any ) => {
				if (!result["isValidToken"]) {
					updateTokenDeferred.reject({ status : 401, key: "TOKEN", value: "INVALID" });
				} else {
					clientAndAccessInfo.updatedTokenInfo = result;
					updateTokenDeferred.resolve(clientAndAccessInfo);
				}
			})
			.fail((err : Error) => { updateTokenDeferred.reject(err); }).done();

			return updateTokenDeferred.promise;
		})
		.then((clientAccessAndTokenInfo : any) => {
			/**
			 * Send Back The Response
			 */
			deferred.resolve(clientAccessAndTokenInfo.updatedTokenInfo);
		})
		.catch((err) => {
			/**
			 * Send Back The Error
			*/
			deferred.reject({ key: err.key || "TOKEN", value: err.value || "INVALID" });
		});
		return deferred.promise;
	}
	
	/**
	 * 
	 * 
	 * @param {string} socialMediaName
	 * @param {boolean} isAuthorizationFlow
	 * @param {User} user
	 * @param {*} userClientInfo
	 * @returns {Q.Promise<User>}
	 * 
	 * @memberOf AuthService
	 */
	registerOrLoginSocialMedia(socialMediaName : string, isAuthorizationFlow : boolean, user: User, userClientInfo : any) : Q.Promise<User> {
		log.debug("registerOrLoginSocialMedia, socialMediaName : " + socialMediaName + ", user : " + JSON.stringify(user));
		let deferred : Q.Deferred<any> = Q.defer();

		this.socialStrategy.registerOrLoginSocialUser(user)
		.then((newUser : User) => { 
			if(!isAuthorizationFlow && user.isValidated) {
				this.accessService.createUserAccessToken(newUser.username, newUser.userType, userClientInfo, newUser)
				.then((userWithAccess : User) => { deferred.resolve(userWithAccess); })
				.fail((err : Error) => { deferred.reject(err); }).done();
			} else {
				deferred.resolve(newUser);
			}
		})
		.fail((err : Error) => { deferred.reject(err); }).done();

		return deferred.promise;
	}
}