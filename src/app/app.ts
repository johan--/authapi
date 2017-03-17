'use strict'

if(process.env.NODE_ENV == 'prod') {
    require('newrelic');
}

import { Request, Response, Router } from "express";
import * as express from "express";
import * as session from "express-session";
import * as passport from "passport";
import * as bodyParser from "body-parser";
import * as mongoose from "mongoose";
import * as log4js from "log4js";
import * as path from "path";
import * as DbConfig from "db-config";
import * as DbConnection from "db-connection";

import { AuthRouter } from "../routes/auth-router";
import { UserRouter } from "../routes/user-router";
import { ClientRouter } from "../routes/client-router";

import { AuthController } from "../controllers/impl/auth";
import { IAuthController } from "../controllers/interface/auth";
import { UserController } from "../controllers/impl/user";
import { IUserController } from "../controllers/interface/user";
import { ClientController } from "../controllers/impl/client";
import { IClientController } from "../controllers/interface/client";

import { AccessService } from "../service/access/impl/access";
import { IAccessService } from "../service/access/interface/access";
import { AuthService } from "../service/auth/impl/auth";
import { IAuthService } from "../service/auth/interface/auth";
import { ClientService } from "../service/client/impl/client";
import { IClientService } from "../service/client/interface/client";
import { EmailServiceFactory } from "../service/email/factory";
import { IEmailService } from "../service/email/interface/email";
import { OIDCService } from "../service/oidc/impl/oidc";
import { IOIDCService } from "../service/oidc/interface/oidc";
import { PassportService } from "../service/passport/passport";
import { IPassportService } from "../service/passport/interface/passport";
import { UserService } from "../service/user/impl/user";
import { IUserService } from "../service/user/interface/user";

import { ITokenManager } from "../token/interface/tokenmanager";
import { TokenFactory, TokenManagerName } from "../token/factory";

import { DaoFactory } from "../model/dao/factory";
import { IDaoFactory } from "../model/dao/iDaoFactory";
import { User } from "../model/entity/user";
import { Logger } from '../util/logger';
import { Helper } from '../util/helper';
import { SessionManager, SessionKeys } from '../util/session';
import ApplicationConfig = require("../config/application-config");
import fs = require('fs');

let authRouter: AuthRouter;
let userRouter: UserRouter;
let clientRouter: ClientRouter;
let connection: mongoose.Connection;
var cors = require('cors');
const app = express();
const log = new Logger('App');

const Log4jsConfig = require("../config/log4js");

// Configure log4js, setting current working directory for writting log files
log4js.configure(Log4jsConfig, {cwd: ApplicationConfig.APP_LOG_PATH});

//Connect logger allows connect/express servers to log using log4js
// automatic level detection to connect-logger, depends on http status response, compatible with express 3.x and 4.x
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

//initialize new Relic

/*app.use(cors(
	{
		origin : true,
		credentials : true
	}
));*/
//For serving static pages and its css. we are using ejs for HTML templating
//And angular js for SPA
//app.set('view engine', 'ejs');
//app.set('views', path.join(__dirname, '../public/staticPages'));
//app.use(express.static(path.join(__dirname, '../public')));

startMongo();

createAndStartServer();

/**
 * create and starts server
 */
function createAndStartServer() : void {
	log.debug("Entering createAndStartServer()");
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	let userDao: any = null;

	let sess = {
		secret: 'IAmS3cr3t',
		resave: true,
		saveUninitialized: false,
		name: "connect.tnfsid"
	}; // session settings
	app.use(session(sess)); // use session settings


	// Assign PORT
	app.set('port', ApplicationConfig.APPLICATION_PORT);

	// Default webroot
	// app.use(express.static(__dirname + '/public'));

	process.on('uncaughtException', function (err: any) {
		log.debug(err.message, err);
	});

	app.use(passport.initialize());
	app.use(passport.session());
	setDependencies();
	setRoutes();

	app.use(function (err: Error, req: Request, res: Response, next: any) {
		log.error(err.stack);
		res.status(500).send('Something broke!' + err.stack);
	});

	app.listen(app.get('port'), function () {
		log.debug('Node app is running on port', app.get('port'));
	});
}

/**
 * Sets dependencies
 */
function setDependencies() : void {
	log.debug("setting dependencies");
	connection = DbConnection.get("mongo", getDbConfiguration()).get();
	let daoFactory : IDaoFactory = new DaoFactory(connection);
	let emailService : IEmailService = EmailServiceFactory.getEmailService();
	let tokenManager : ITokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);
	let passportService : IPassportService = new PassportService(passport, tokenManager, daoFactory);
	let accessService : IAccessService = new AccessService(daoFactory, tokenManager);
	let authService : IAuthService = new AuthService(emailService, accessService, daoFactory, tokenManager);
	let clientService : IClientService = new ClientService(daoFactory);
	let userService : IUserService = new UserService(daoFactory, tokenManager);
	let oidcService : IOIDCService = new OIDCService(clientService, userService, accessService, passportService, daoFactory);

	let authController : IAuthController = new AuthController(authService, oidcService, passport);
	authRouter = new AuthRouter(authController);
	let userController = new UserController(userService);
	userRouter = new UserRouter(userController);
	let clientController = new ClientController(clientService);
	clientRouter = new ClientRouter(clientController);
	setIntercepter(userService);
}

/**
 * Get DB configuration
 * 
 * @returns {DbConfig.DbConfigInterface}
 */
function getDbConfiguration(): DbConfig.DbConfigInterface {
	return DbConfig.get(ApplicationConfig.MONGO_DB_CONFIG);
}

/**
 * Set routes
 */
function setRoutes() : void {
	let baseUrl:string = '/auth';
	app.get(baseUrl + "/", function (req: Request, res: Response) {
       res.status(200).header('Content-Type', 'application/json').send(JSON.stringify({
			metadata: {
				status: "success",
				message: {
					"Application_Status": "Im Healthy!"
				}
			}
		}));
    });


	log.debug("setting routes");
	app.use(baseUrl + "/user/auth", authRouter.getRouter());
	app.use(baseUrl + "/user", userRouter.getRouter());
	app.use(baseUrl + "/client", clientRouter.getRouter());
	app.get(baseUrl + '/health', function (req: Request, res: Response) {
		res.status(200).header('Content-Type', 'application/json').send(JSON.stringify({
			metadata: {
				status: "success",
				message: {
					"Application_Status": "Im Healthy!"
				}
			}
		}));
	});
}

/**
 * Sets interceptors
 * 
 * @param {IAuthService} authService
 */
function setIntercepter(userService: IUserService) {
	app.use(function (request: Request, response: any, next: any) {
		log.debug("setIntercepter");
		SessionManager.get(request, SessionKeys.User_Details) 
		.then((user : User) => {
			if(user) {
				next();
			} else {
				let accessToken: string = Helper.getAuthorizationFromHeader(request);
				
				if (accessToken) {
					userService.getUserByAuthToken(accessToken)
					.then((user : User) => {
						user.credential = null;
						user.accessToken = null;
						SessionManager.set(request, SessionKeys.User_Details, user)
						.then((sessionUser : User) => { next(); })
						.fail((err : Error) => { log.error("Failed to get user by authtoken", err); next(); }).done();
					})
					.fail((err : Error) => {
						log.error("Issue with finding user by auth token", err);
						next();
					}).done();
				} else {
					log.debug("Intercepter Nothing found.");
					next();	
				}
			}
		})
		.fail((err : Error) => {
			log.error("Issue with finding user by auth token", err);
			next();
		});
	});
}

function startMongo() {
	/*mongoose.connect(ApplicationConfig.MONGO_DB_URL.toString());
	var dbConnection = mongoose.connection;
	dbConnection.on('error', console.error.bind(console, 'connection error:'));
	dbConnection.once('open', function callback () {
    	 log.debug('Connected To Mongo Database');
	});
	*/
}

module.exports= app ;
module.exports.connection = connection;
