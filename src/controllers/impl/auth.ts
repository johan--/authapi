'use strict'

import { IAuthController } from "../interface/auth";
import { Request, Response } from "express";
import { IAuthService } from "../../service/auth/interface/auth";
import { IOIDCService, AuthRequestWorkFlow } from "../../service/oidc/interface/oidc";
import { User } from "../../model/entity/user";
import { Scope } from "../../model/entity/scope";
import { AuthorizeRequestData } from "../../model/entity/authorize-request-data";
import { Helper } from "../../util/helper";
import { AppResponse } from "../../util/response";
import { DaoFactory } from "../../model/dao/factory";
import { Logger } from '../../util/logger';
import { SessionManager, SessionKeys } from '../../util/session';
import ApplicationConfig = require("../../config/application-config");

const log = new Logger('AuthController');

export class AuthController implements IAuthController {

	constructor(public authService : IAuthService, public oidcService : IOIDCService, public passport : any) {
		log.debug("Intialized Auth Controller : ");
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	registerUser(request: Request, response: Response) {
		log.debug("registerUser: " + JSON.stringify(request.body));
		let self = this;

		this.passport.authenticate('local-signup', function (err: Error, user: User, info: any) {
			if (err) {
				AppResponse.failure(response, err);
			}
			else {
				self.authService.registerUser(user, info)
				.then((user : User) => {
					user.credential = null;
					user.accessToken = null;
					return SessionManager.set(request, SessionKeys.User_Details, user);
				})
				.then(() => { AppResponse.created(response, user); })
				.fail((err : Error) => { AppResponse.failure(response, err); })
        		.done();
			}
		})(request, response, null);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 * @param {*} next
	 *
	 * @memberOf AuthController
	 */
	verifyRegistration(request: Request, response: Response, next: any) : void {
		log.debug("verifyRegistration");
		let username : string = request.headers['username'] || request.body.username;
		let registrationVerificationToken : string = request.headers['registrationverificationtoken'] || request.body.registrationVerificationToken;
		if ((username && username!== '' && username !== null) && (registrationVerificationToken && registrationVerificationToken !== '' && registrationVerificationToken !== null)) {
			this.authService.verifyRegistration(username, registrationVerificationToken, Helper.getUserClientInfo(request))
			.then((user : User) => {
				SessionManager.set(request, SessionKeys.User_Details, user);
				if (next) {
					next(null, user);
				} else {
					AppResponse.success(response, user);
				}
			})
			.fail((err : Error) => { AppResponse.failure(response, err); })
			.done();
		} else {
			AppResponse.warn(response, { status : 404, key: "UNEXPECTED_ERROR", value: "missing parameters : username or registrationverificationtoken not present in request" });
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 * @param {*} next
	 *
	 * @memberOf AuthController
	 */
	loginUserByBasicCredential(request: Request, response: Response) : void {
		log.debug("loginUserByBasicCredential");
		let self = this;

		this.passport.authenticate('local-login', function (err: Error, user: User, info: any) {
			if (err) {
				AppResponse.failure(response, err);
			}
			else {
				self.authService.loginUserByBasicCredential(user, info, Helper.getUserClientInfo(request))
				.then((user : User) => {
					return SessionManager.set(request, SessionKeys.User_Details, user);
				})
				.then(() => { AppResponse.created(response, user); })
				.fail((err : Error) => { AppResponse.failure(response, err); })
        		.done();
			}
		})(request, response, null);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	loginByIp(request: Request, response: Response) : void {
		log.debug("loginByIp");
		let self = this;
		this.passport.authenticate("ip-custom", function(err: Error, ipuser : User) {
			if (err) {
				AppResponse.failure(response, err);
			}
			else {
				self.authService.loginByIp(ipuser, Helper.getUserClientInfo(request))
				.then((user : User) => {
                     AppResponse.created(response, user);
                 })
				.fail((err : Error) => { AppResponse.failure(response, err); })
				.done();
			}
		})(request, response, null);
    }

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	getOrcidLogin(request: Request, response: Response): void {
		log.debug("getOrcidLogin");
		//this.passport.authenticate('orcid')(request, response, null);
		if (request.query && request.query.clientId) {
			response.redirect(ApplicationConfig.ORCID_CONFIG.authorizationURL + "&state=" + request.query.clientId);
		} else {
			response.redirect(ApplicationConfig.ORCID_CONFIG.authorizationURL);
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	loginOrRegisterUserByOrcid(request: Request, response: Response): void {
		log.debug("loginOrRegisterUserByOrcid");
		let self = this;
		let tnfClientId = request.query.state;

		this.passport.authenticate("orcid-custom", function (err: Error, user: User, info: any) {
			SessionManager.get(request, SessionKeys.IsAuthorizationFlow)
			.then((isAuthorizationFlow : boolean) => {
				return self.authService.loginOrRegisterUserByOrcid(tnfClientId, Helper.getUserClientInfo(request), isAuthorizationFlow, err, user, info);
			})
			.then((user : User) => { AppResponse.created(response, user); })
			.fail((err : Error) => { AppResponse.failure(response, err); })
			.done();
		})(request, response, null);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	logoutUser(request: Request, response: Response) : void {
		log.debug("logoutUser");
		let idToken: string = Helper.getIdToken(request);

		SessionManager.sessionDestroy(request)
		.then((destroyed : boolean) => { return this.authService.logoutUser(idToken); })
		.then((result : any) => {
			request.logout();
			AppResponse.success(response, result);
		})
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	generateForgotPasswordToken(request: Request, response: Response) : void {
		log.debug("generateForgotPasswordToken");
		let username : string = request.headers['username'] || request.query.username || request.body.username;
		if (username) {
			this.authService.generateForgotPasswordToken(username)
			.then((result : any) => { AppResponse.success(response, result); })
			.fail((err : Error) => { AppResponse.failure(response, err); })
			.done();
		} else {
			AppResponse.warn(response, { status : 400, key: "EMAIL_ADDRESS", value: "Email address not present" });
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	verifyForgotPasswordToken(request: Request, response: Response) : void {
		log.debug("verifyForgotPasswordToken");
		let username : string = request.headers['username'] || request.params.username || request.body.username;
		let resetPasswordToken : string = request.headers['resetpasswordtoken'] || request.params.resetPasswordToken || request.body.resetPasswordToken;
		if (!username) {
			AppResponse.warn(response, { status : 400, key: "USER_NAME", value: "username not present in request" });
		} else if (!resetPasswordToken) {
			AppResponse.warn(response, { status : 401, key: "RESET_PASSWORD_TOKEN", value: "resetPasswordToken not present in request" });
		}
		else {
			this.authService.verifyForgotPasswordToken(username, resetPasswordToken)
			.then((result : any) => { AppResponse.success(response, result); })
			.fail((err : Error) => { AppResponse.failure(response, err); })
			.done();
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	resetPassword(request: Request, response: Response) : void {
		log.debug("verifyForgotPasswordToken");
		let username = request.headers['username'] || request.params.username || request.body.username;
		let newPassword = request.headers['newpassword'] || request.params.newPassword || request.body.newPassword;
		let resetPasswordToken = request.headers['resetpasswordtoken'] || request.params.resetPasswordToken || request.body.resetPasswordToken;
		if (username && newPassword) {
			this.authService.resetPassword(username, newPassword, resetPasswordToken)
			.then((result : any) => { AppResponse.success(response, result); })
			.fail((err : Error) => { AppResponse.failure(response, err); })
			.done();
		} else {
			AppResponse.warn(response, { status : 404, key: "REQUEST_PARAMETERS", value: "missing parameters" });
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	updatePassword(request: Request, response: Response) : void {
		log.debug("updatePassword");
		let username = request.headers['username'] || request.params.username || request.body.username;
		let newPassword = request.headers['newpassword'] || request.params.newPassword || request.body.newPassword;
		let oldPassword = request.headers['oldpassword'] || request.params.oldPassword || request.body.oldPassword;
		if (username && newPassword && oldPassword) {
			this.authService.updatePassword(username, newPassword, oldPassword)
			.then((user : User) => { AppResponse.success(response, user); })
			.fail((err : Error) => { AppResponse.failure(response, err); })
			.done();
		} else {
			AppResponse.warn(response, { status : 404, key: "REQUEST_PARAMETERS", value: "missing parameters" });
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	validateAccessToken(request: Request, response: Response) : void {
		log.debug("validateAccessToken");
		let clientIp = request.headers['clientip'];
		let idToken: string = Helper.getIdToken(request);
		if (!idToken) {
			AppResponse.warn(response, { status : 400, key: "TOKEN", value: "token is not present in header." });
		}
		else {
			this.authService.validateAccessToken(clientIp, idToken)
			.then((result : any) => { AppResponse.success(response, result); })
			.fail((err : Error) => { AppResponse.failure(response, err, { isValidToken : false }); })
			.done();
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	getFacebookLogin(request: Request, response: Response): void {
		log.debug("getFacebookLogin");
		this.passport.authenticate("facebook", { scope: ['email', "user_birthday", "user_hometown", "user_work_history"] })(request, response, null);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	loginOrRegisterUserByFacebook(request: Request, response: Response) : void {
		log.debug("loginOrRegisterUserByFacebook");
		this.registerOrLoginSocialMedia("facebook", request, response);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	getTwitterLogin(request: Request, response: Response) : void {
		log.debug("getTwitterLogin");
		this.passport.authenticate("twitter", { session: false })(request, response, null);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	loginOrRegisterUserByTwitter(request: Request, response: Response) : void {
		log.debug("loginOrRegisterUserByTwitter");
		this.registerOrLoginSocialMedia("twitter", request, response);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	getLinkedinLogin(request: Request, response: Response) : void {
		log.debug("getLinkedinLogin");
		this.passport.authenticate("linkedin", { scope: ['r_basicprofile', 'r_emailaddress'] })(request, response, null);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	loginOrRegisterUserByLinkedin(request: Request, response: Response) : void {
		log.debug("loginOrRegisterUserByLinkedin");
		this.registerOrLoginSocialMedia("linkedin", request, response);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	getGoogleLogin(request: Request, response: Response) : void {
		log.debug("getGoogleLogin");
		this.passport.authenticate("google", { scope: ['profile', 'email'] })(request, response, null);
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	loginOrRegisterUserByGoogle(request: Request, response: Response) : void {
		log.debug("loginOrRegisterUserByGoogle");
		this.registerOrLoginSocialMedia("google", request, response);
	}

	/**
	 *
	 * Issues Tokens To The Clients, Should Check For Valid Client And Code To Be Present In DB.
	 *
	 * We'll also have to look at how we can use this method to issue the merged/updated token too.
	 *
	 * Can also
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	token(request: Request, response: Response) : void {
		log.debug("token");
		try {
			let ipaddress = request.headers['clientip'] || "";
			let grantType : string = request.body.grant_type;
			let clientId : string = request.body.client_id;
			let clientSecret : string = request.body.client_secret;
			let code : string = request.body.code;
			let redirectURI : string = request.body.redirect_uri;

			this.oidcService.token(grantType, code, clientId, clientSecret, redirectURI, ipaddress)
			.then((result : any) => { response.json(result); })
			.fail((err : Error) => { AppResponse.failure(response,err); });
		} catch (error) {
			AppResponse.failure(response, new Error(error));
		}
	}

	/**
	 *
	 * Handles The Authorization WorkFlow.
	 *
	 * Steps:
	 *
	 *  # Populate The Session With The Authorization Request
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	authorize(request: Request, response: Response): void {
		/**Get Request Parameters */
		let clientId : string = null;
		try {
			log.debug("authorize : create authorize request data");
			let authorizeRequestData : AuthorizeRequestData = this.getAuthorizeRequestParameters(request);
			log.debug("authorize : checking for clientId, authorize request data : " + JSON.stringify(authorizeRequestData));
			authorizeRequestData.checkForClientId();
			clientId = authorizeRequestData.clientId;
			/**Set The Authorize Request Data Into Session */
			SessionManager.getAuthorizeRequestData(request, authorizeRequestData.clientId)
			.then(
			/** Find Out If We Already Have A Authorization Request With This Client Id For This Particular Session */
			(storedAuthorizeRequestData : AuthorizeRequestData) : Q.Promise<AuthorizeRequestData> => {
				if(null !== storedAuthorizeRequestData && undefined !== storedAuthorizeRequestData) {
					authorizeRequestData = new AuthorizeRequestData(storedAuthorizeRequestData.clientId, storedAuthorizeRequestData.redirectURI, storedAuthorizeRequestData.responseType, storedAuthorizeRequestData.scope, storedAuthorizeRequestData.state);
				}
				log.debug("authorize : checking for mandatory parameters, authorize request data : " + JSON.stringify(authorizeRequestData));
				authorizeRequestData.checkForMandatoryParameters();
				log.debug("authorize : checking for updated params : " + JSON.stringify(authorizeRequestData));
				authorizeRequestData = this.checkForUpdatedParameters(request, authorizeRequestData);
				log.debug("authorize : after checking if ongoing authorize flow parameters, authorize request data : " + JSON.stringify(authorizeRequestData));
				return SessionManager.setAuthorizeRequestData(request, authorizeRequestData);
			})
			/** Check Whether The User Is Logged In, That Is Whether The User Is In Session */
			.then((authorizeRequestData : AuthorizeRequestData) : Q.Promise<boolean> => {
				log.debug("authorize : checking if user in session")
				return SessionManager.isUserInSession(request);
			})
			/** Update The Authorize Request Data With The User State */
			.then((isUserInSession : boolean) => {
				log.debug("authorize : user in session : " + isUserInSession);
				authorizeRequestData.setIsUserLoggedIn(isUserInSession);
				return SessionManager.get(request, SessionKeys.User_Details);
			})
			/** */
			.then((user : User) => {
				authorizeRequestData.user = user;
				return SessionManager.setAuthorizeRequestData(request, authorizeRequestData);
			})
			/** Process The Authorize Request */
			.then((authorizeRequestData : AuthorizeRequestData) => {
				log.debug("authorize : processing authorize request");
				return this.oidcService.processAuthorizeRequest(authorizeRequestData);
			})
			.then((authorizeRequestData : AuthorizeRequestData) => {
				log.debug("authorize : success");
				let returnURL = authorizeRequestData.goto;
				returnURL = returnURL + authorizeRequestData.getQueryString();
				if(authorizeRequestData.isWorkFlowCompleted) {
					SessionManager.removeAuthorizeRequestData(request, authorizeRequestData.clientId);
				}
				AppResponse.warn(response, { callbackURL : returnURL });
			})
			.fail((authorizeWorkFlow : AuthRequestWorkFlow) => {
				log.debug("authorize : fail " + JSON.stringify(authorizeWorkFlow));
				SessionManager.removeAuthorizeRequestData(request, authorizeRequestData.clientId);
				if(authorizeWorkFlow instanceof Array) {
					AppResponse.failure(response, null, { missingParameters : authorizeWorkFlow });
				} else if(authorizeWorkFlow && authorizeWorkFlow.authorizeRequestData) {
					let returnURL = authorizeWorkFlow.authorizeRequestData.redirectURI + "?error=" + authorizeWorkFlow.errorParams["error"] + "&message=" + authorizeWorkFlow.errorParams["message"];
					AppResponse.failure(response, null, { callbackURL : returnURL });
				} else {
					AppResponse.failure(response, new Error("Authorize failed, some error occurred"));
				}
			});
		} catch (error) {
			log.debug("authorize : Error : fail");
			SessionManager.removeAuthorizeRequestData(request, clientId);
			if(error instanceof Array) {
				AppResponse.failure(response, null, { missingParameters : error });
			} else {
				AppResponse.failure(response, error);
			}
		}
	}

	/**
	 *
	 *
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	consent(request: Request, response: Response): void {
		log.debug("consent");
		try {
			let clientId : string = request.query["client_id"];
			let accept : any = request.param("accept");
			/**Set The Authorize Request Data Into Session */
			SessionManager.getAuthorizeRequestData(request, clientId)
			.then(
			/** Find Out If We Already Have A Authorization Request With This Client Id For This Particular Session */
			(storedAuthorizeRequestData : AuthorizeRequestData) : Q.Promise<AuthorizeRequestData> => {
				log.debug("consent : authorize request data : " + JSON.stringify(storedAuthorizeRequestData));
				return this.oidcService.consent(storedAuthorizeRequestData, accept);
			})
			.then((authorizeRequestData : AuthorizeRequestData) => {
				log.debug("consent : success");
				let returnURL = authorizeRequestData.goto;
				AppResponse.warn(response, { callbackURL : returnURL });
			})
			.fail((err : Error) => {
				log.debug("consent : fail");
				AppResponse.failure(response,err);
			});
		} catch (error) {
			AppResponse.failure(response, new Error(error));
		}
	}

	/**
	 *
	 *
	 * @private
	 * @param {string} strategyName
	 * @param {Request} request
	 * @param {Response} response
	 *
	 * @memberOf AuthController
	 */
	private registerOrLoginSocialMedia(strategyName : string, request : Request, response : Response) {
		log.debug("registerOrLoginSocialMedia");
		let self = this;
		let userDetails : User = null;
		this.passport.authenticate(strategyName, function (err: Error, user: User) {
			log.debug("sending " + strategyName + " response:", { error: err, user: user });
			if (user) {
				SessionManager.get(request, SessionKeys.IsAuthorizationFlow)
				.then((isAuthorizationFlow : boolean) => {
					return self.authService.registerOrLoginSocialMedia(strategyName, isAuthorizationFlow, user, Helper.getUserClientInfo(request));
				})
				.then((newUser : User) => {
					userDetails = newUser
					return SessionManager.set(request, SessionKeys.User_Details, newUser);
				})
				.then(() => { AppResponse.created(response, user); })
				.fail((err : Error) => { AppResponse.failure(response, err, { isValidToken : false }); })
				.done();
			} else {
				AppResponse.failure(response, err || new Error("User not found."), { isValidToken : false });
			}
		})(request, response, null);
	}
	/**
	 *
	 *
	 * @private
	 * @param {Request} request
	 * @returns {AuthorizeRequestData}
	 *
	 * @memberOf AuthController
	 */
	private getAuthorizeRequestParameters(request : Request) : AuthorizeRequestData {
		let authorizeRequestData : AuthorizeRequestData = new AuthorizeRequestData(request.query.client_id,
		request.query.redirect_uri, request.query.response_type, Scope.getScopesFromAuthorizationString(request.query.scope), request.query.state);
		return authorizeRequestData;
	}

	/**
	 *
	 *
	 * @private
	 * @param {Request} request
	 * @param {AuthorizeRequestData} authorizeRequestData
	 * @returns {AuthorizeRequestData}
	 *
	 * @memberOf AuthController
	 */
	private checkForUpdatedParameters(request : Request, authorizeRequestData : AuthorizeRequestData) : AuthorizeRequestData {
		if(request.query.state) {
			authorizeRequestData.state = request.query.state;
		}
		return authorizeRequestData;
	}
}
