'use strict'

import { Request, Response } from "express";
import { IPassportService } from "./interface/passport";
import { SocialStrategy } from "./social-strategy";
import { OrcidCustomStrategy } from "./orcid-custom-strategy";
import { LoginByIpCustomStrategy } from "./loginbyip-custom-strategy";
import { User } from "../../model/entity/user";
import { AccessToken } from "../../model/entity/access-token";
import { BasicCredential } from "../../model/entity/basic-credential";
import { DaoFactory } from "../../model/dao/factory";
import { IUserDao } from "../../model/dao/interface/user-dao";
import { IClientDao } from "../../model/dao/interface/client-dao";
import { IProfileTransform } from "../../profile-transform/interface/profile-transform";
import { ProfileTransformFactory, ProfileName } from "../../profile-transform/factory";
import { Logger } from "../../util/logger";
import { Helper } from "../../util/helper";
import { EncryptionUtil } from "../../util/encryption";
import ApplicationConfig = require("../../config/application-config");

let LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook");
var LinkedinStrategy = require("passport-linkedin");
var TwitterStrategy = require("passport-twitter");
var GoogleStrategy = require("passport-google-oauth2");

const log = new Logger('PassportService');

class PassportService implements IPassportService {

	userDao: IUserDao;
	passport: any;
	socialStrategyUtil : SocialStrategy;
	clientDao : IClientDao;
	daoFactory: DaoFactory;

	constructor(passportInstance: any, daoFactory: DaoFactory) {
		this.passport = passportInstance;
		this.userDao = daoFactory.getUserDao();
		this.clientDao = daoFactory.getClientDao();
		this.initializePassportSettings();
		this.initializeStrategies();
		this.socialStrategyUtil = new SocialStrategy(daoFactory);
		this.daoFactory = daoFactory;
	}

	/**
	 * 
	 * 
	 * @private
	 * 
	 * @memberOf PassportService
	 */
	private initializePassportSettings() {
		log.debug("initializePassportSettings");
		let self = this;
		//serialise
		this.passport.serializeUser(function (user: User, done: any) {
			done(null, user.id);
		});

		//deserialise
		let User = this.userDao;
		this.passport.deserializeUser(function (id: string, done: any) {
			self.userDao.getUserByUserId(id)
			.then((user : User) => { done(null, user); })
			.fail((err : Error) => { done(err, null); }).done();
		});
	}

	/**
	 * 
	 * 
	 * @private
	 * 
	 * @memberOf PassportService
	 */
	private initializeStrategies() {
		console.log("initializeStrategies");
		this.createLocalStrategy();
		new OrcidCustomStrategy(this.passport, this.daoFactory);
		new LoginByIpCustomStrategy(this.passport, this.daoFactory);
		this.createFacebookStrategy();
		this.createTwitterStrategy();
		this.createLinkedinStrategy();
		this.createGoogleStrategy();
	}

	/**
	 * 
	 * 
	 * @private
	 * 
	 * @memberOf PassportService
	 */
	private createGoogleStrategy() {
		console.log("createGoogleStrategy");
		this.passport.use(new GoogleStrategy(ApplicationConfig.GOOGLE_CONFIG,
			function(accessToken:any, refreshToken:any, googleProfile:any, cb:any) {			
				let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.google);
				let userProfile: User = profileTransform.createUserFromProfile(googleProfile);
				log.debug("User from google : ", userProfile);
				cb(null, userProfile);
			}
		));
	}

	/**
	 * 
	 * 
	 * @private
	 * 
	 * @memberOf PassportService
	 */
	private createLinkedinStrategy() {
		console.log("createLinkedinStrategy");
		this.passport.use(new LinkedinStrategy(ApplicationConfig.LINKEDIN_CONFIG,
			function(accessToken:any, refreshToken:any, linkedinProfile:any, cb:any) {
				let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.linkedin);
				let userProfile: User = profileTransform.createUserFromProfile(linkedinProfile);
				log.debug("User from linkedinProfile : ", userProfile);
				//self.socialStrategyUtil.registerOrLoginSocialUser(userProfile, cb);
				cb(null, userProfile);	
			}
		));
	}

	/**
	 * 
	 * 
	 * @private
	 * 
	 * @memberOf PassportService
	 */
	private createFacebookStrategy() {
		console.log("createFacebookStrategy");
		this.passport.use(new FacebookStrategy(ApplicationConfig.FACEBOOK_CONFIG,
			function(accessToken:any, refreshToken:any, fbProfile:any, cb:any) {
				let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.facebook);
				let userProfile: User = profileTransform.createUserFromProfile(fbProfile);
				log.debug("User from fbProfile : ", userProfile);
				//self.socialStrategyUtil.registerOrLoginSocialUser(userProfile, cb);
				cb(null, userProfile);	
			}
		));
	}

	/**
	 * 
	 * 
	 * @private
	 * 
	 * @memberOf PassportService
	 */
	private createTwitterStrategy() {
		console.log("createTwitterStrategy");
		this.passport.use(new TwitterStrategy(ApplicationConfig.TWITTER_CONFIG,
			function(accessToken:any, tokenSecret:any, twitterProfile:any, cb:any) {
				let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.twitter);
				let userProfile: User = profileTransform.createUserFromProfile(twitterProfile);
				log.debug("User from twitterProfile : ", userProfile);
				//self.socialStrategyUtil.registerOrLoginSocialUser(userProfile, cb);
				cb(null, userProfile);		
			}
		));
	}
	
	/**
	 * 
	 * 
	 * @private
	 * 
	 * @memberOf PassportService
	 */
    private createLocalStrategy() {
		log.debug("initializing Local Strategy");
		let self = this;
		this.passport.use("local-login", new LocalStrategy({ usernameField: "username", passwordField: "password", passReqToCallback: true },
			function (req: Request, username: String, password: String, done: any) {
				process.nextTick(function () {
					self.userDao.getUserByUserName(username.toLowerCase())
					.then((user : User) => {
						if (!user) {
							log.debug("Invalid email address.");
							return done(null, false, { key: "EMAIL_ADDRESS", value: "Invalid email address." });
						}
						let credential = <BasicCredential>user.credential;

						if (!EncryptionUtil.validate(credential.password, password)) {
							log.debug("Invalid password!");
							return done(null, false, { key: "PASSWORD", value: "Password is incorrect." });
						}
						let criteria = { user: user.id }
						done(null, user);
					})
					.fail((err : Error) => { done(err); }).done();
				});
			}
		));

		this.passport.use("local-signup", new LocalStrategy({ usernameField: "username", passwordField: "password", passReqToCallback: true },
			function (req: Request, username: string, password: string, done: any) {
				process.nextTick(function () {
					if(!Helper.isEmailValid(username)) {
						return done(null, false, { key: "EMAIL_ADDRESS", value: "Invalid email address." });
					}
					if (!Helper.validatePassword(password)) {
						return done(null, false, { key: "PASSWORD", value: "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $)." });
					}
					self.userDao.getUserByUserName(username.toLowerCase())
					.then((user : User) => {
						if (user) {
							done(null, false, { key: "EMAIL_ADDRESS", value: "Email address is already registered." });
						} else {
							let userInput: User = User.createUserFromRequest(req);
							self.userDao.createUser(userInput)
							.then((newuser : User) => { done(null, newuser); })
						}
					})
					.fail((err : Error) => { done(err); }).done();
				});
			}
		));
	}
}