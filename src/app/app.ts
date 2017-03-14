require('newrelic');
import express = require("express");
import {Request, Response, Router} from "express";
import session = require('express-session');

var cors = require('cors');

import log4js = require('log4js');
import {Logger } from "log4js";

import UserRouter = require("../routes/user-router");
import ClientRouter = require("../routes/client-router");
import authRouter = require("../routes/auth-router");

// Import modules
import passport = require("passport");
import bodyParser = require("body-parser");
import ApplicationConfig = require("../config/application-config");
import PassportAuthController = require("../controllers/passport/auth-controller-passport");
import SimpleUserController = require("../controllers/simple-user-controller");
import SimpleClientController = require("../controllers/simple-client-controller");
import TokenManager = require('../token/tokenmanager-impl');
import EmailServiceImpl = require('../email/email-service-impl');
import PassportServiceImpl = require("../passport/passport-impl");
import AccessTokenUtil = require("../passport/access-token-util");
import SocialStrategyUtil = require("../passport/social-strategy-util");
import IpStrategyUtil = require("../passport/ip-strategy-util");

import UserFactory = require("../util/userfactory");
import mongoose = require("mongoose");
import IUser = require("../model/entity/user");
import MongoUserDao = require("../model/mongo/dao/user-dao-mongo");
import MongoClientDao = require("../model/mongo/dao/client-dao-mongo");
import MongoAccessDao = require("../model/mongo/dao/access-dao-mongo");
import DbConfig = require("db-config");
import DbConnection = require("db-connection");
import path = require("path");
import DaoFactory = require('../model/dao/dao-factory')

let log: Logger = log4js.getLogger("app");
let userRouter: UserRouter;
let clientRouter: ClientRouter;
let connection: mongoose.Connection;
const app = express();
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

function createAndStartServer() {
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
		console.log('Caught exception: ' + err, err.stack);

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
		console.log('Node app is running on port', app.get('port'));
	});
}

function setDependencies() {
	log.debug("setting dependencies");
	connection= DbConnection.get("mongo", getDbConfiguration()).get();
	DaoFactory.initializaMongoConnection(connection);
	let userDao = DaoFactory.getUserDao();
	let accessDao = DaoFactory.getAccessDao();
	let clientDao = DaoFactory.getClientDao();
	let tokenMan = new TokenManager();
	let emailService = new EmailServiceImpl();
	let userFactory = new UserFactory();
	let passportService = new PassportServiceImpl(userDao, passport, tokenMan, new UserFactory(), clientDao);
	let accessTokenUtil = new AccessTokenUtil(userDao, tokenMan, accessDao, userFactory, clientDao);
	let socialStrategyUtil = new SocialStrategyUtil(userDao);
	let ipStrategyUtil = new IpStrategyUtil(userDao);
	let passportAuthController = new PassportAuthController(userDao, clientDao, tokenMan, emailService, passportService, passport, socialStrategyUtil, ipStrategyUtil, accessTokenUtil, accessDao);
	authRouter.setAuthController(passportAuthController);
	let userController = new SimpleUserController(userDao);
	userRouter = new UserRouter(userController);
	let clientController = new SimpleClientController(clientDao);
	clientRouter = new ClientRouter(clientController);
	setIntercepter(userDao);
}

function getDbConfiguration(): DbConfig.DbConfigInterface {
	return DbConfig.get(ApplicationConfig.MONGO_DB_CONFIG);
}

function setRoutes() {
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
function setIntercepter(userDao: any) {
	app.use(function (request: Request, response: any, next: any) {
		log.debug("Request Headers", request.headers);
		log.debug("Entering Intercepter, Session ? === ", request.session["userDetails"] ? true : false);
		log.debug("Entering Intercepter, authtoken && authorization ", request.headers["authtoken"], request.headers['authorization']);
		if (request.session["userDetails"]) {
			request.authenticatedUser = request.session["userDetails"];
			next();
		} else {
			let acessToken: string = null;
			if (request.headers["authtoken"]) {
				acessToken = request.headers["authtoken"];
			} else if (request.headers['authorization'] && request.headers['authorization'].indexOf('Bearer ') > -1) {
				acessToken = request.headers['authorization'].replace('Bearer', '').trim();
			}
			
			if (acessToken) {
				userDao.getUserByAuthToken(acessToken
					, function (err: Error, user: IUser) {
						if (user) {
							request.authenticatedUser = user;
						}
						next();
					});
			} else {
				log.debug("Intercepter Nothing found.");
				next();
			}
		}
	});
}

function startMongo() {
	/*mongoose.connect(ApplicationConfig.MONGO_DB_URL.toString());
	var dbConnection = mongoose.connection;
	dbConnection.on('error', console.error.bind(console, 'connection error:'));
	dbConnection.once('open', function callback () {
    	 console.log('Connected To Mongo Database');
	});
	*/
}

module.exports= app ;
module.exports.connection = connection;