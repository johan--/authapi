import express = require('express');
import {Request, Response, Router} from "express";
import IAuthController = require('../controllers/auth-controller');
import MongoUserDao = require("../model/mongo/dao/user-dao-mongo");
import MongoClientDao = require("../model/mongo/dao/client-dao-mongo");
import MongoAccessDao = require("../model/mongo/dao/access-dao-mongo");
import MongoAuthDao = require("../model/mongo/dao/auth-dao-mongo");
import MongoConsentDao = require("../model/mongo/dao/consent-dao-mongo");
import MongoRefreshDao = require("../model/mongo/dao/refresh-dao-mongo");
import DbConfig = require("db-config");
import ApplicationConfig = require("../config/application-config");


import log4js = require('log4js');
import {Logger } from "log4js";

let options: any = {
	// login_url: '/user/auth/authorizatonLogin',
	consent_url: ApplicationConfig.REDIRECT_CONFIG.consent_url,
	scopes: {
        foo: 'Access to foo special resource',
        bar: 'Access to bar special resource',
        mail: 'Access to foo special resource',
        username: 'Access to bar special resource',
        friends: 'Access to foo special resource',
        dob: 'Access to bar special resource'
    },
	models: { user: { attributes: { sub: function () { return this.email; } } } }
};
let oidc = require('../openid-connect/oidc').oidc(options, MongoClientDao, MongoUserDao, MongoAccessDao, MongoConsentDao, MongoRefreshDao, MongoAuthDao);
let oidcAuth = require('../openid-connect/oidc_auth').oidc(options);

let log: Logger = log4js.getLogger("Auth-Router");
let router: Router = express.Router();
let authController: IAuthController;

let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;

//web page servers

/**
   * @swagger
   * tags:
   *   - name: Auth-Routers
   *     description: /user/auth
   *   - name: Client-Routers
   *     description: /client
   *   - name: User-Routers
   *     description: /user
   */


/**
  * @swagger
  * "/user/auth/authorize":
  *  get:
  *   options:
  *     "$ref": "#/definitions/custom-CORS-response"
  *   tags:
  *   - Auth-Routers
  *   description: for authorization of a user
  *   operationId: for the URL
  *   produces:
  *   - text/html
  *   parameters:
  *   - name: response_type
  *     in: query
  *     description: Job to authorize
  *     type: string
  *     required: true
  *   - name: client_id
  *     in: query
  *     description: Job to authorize
  *     type: string
  *     required: true
  *   - name: scope
  *     in: query
  *     description: Job to authorize
  *     type: string
  *     required: true
  *   - name: redirect_uri
  *     in: query
  *     description: Job to authorize
  *     type: string
  *     required: true
  *   responses:
  *     '200':
  *       description: create response
  *       schema:
  *         "$ref": "#/definitions/create"
  */

 

router.get("/authorize", function (request: Request, response: Response, next: any) {
	log.debug("GET authorize: ", request.query, request.session["clientData"]);
	request.session["isAuthorizationFlow"] = true;
	request.session["req_client_id"] = request.query.client_id;
	next();
}, oidcAuth.auth());

/**
 *  @swagger
 * "/user/auth/mylogout":
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for logout of a user through token
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: token
 *      in: path
 *      description: token issued while user is logged in 
 *      required: true
 *      type: string
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.get('/mylogout', function (request: Request, response: Response) {
	log.debug("GET : mylogout", request.session);
   	request.session.destroy(function (err) {
		// cannot access session here 
		response.status(200).send(new ApiResponse(new MetaData("success", null), null));
	});
});
router.get('/consent', oidcAuth.renderConsent());
/*router.get('/consent', function (req: Request, res: Response) {
	console.log("from consent route", req.session["scopes"]);
	res.render("consent", { scopes: req.session["scopes"], client_name: req.session["client_name"] });
});*/
router.post('/consent', oidcAuth.consent());

/**
 * @swagger
 * "/user/auth/token":
 *   post:
 *    tags:
 *    - Auth-Routers
 *    description: for authorising a client by generating token
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: grant_type
 *      in: form-data
 *      description: Job to generate token
 *      required: true
 *      type: string
 *      example: client_credentials
 *    - name: client_id  
 *      in: form-data
 *      description: Job to generate token
 *      required: true
 *      type: string
 *      example: 5ae8e1bde87a5b8d1dc2eaeb99bb3c62a4f5deb41438bf15b71c93b79e8773f1
 *    - name: client_secret  
 *      in: form-data
 *      description: Job to generate token
 *      required: true
 *      type: string
 *      example: b8e6239f13175526bddbdfb574bf943934b2132453d1d91bc7f86d50eb69c8c5
 *    - name: code  
 *      in: form-data
 *      description: Job to generate token
 *      required: true
 *      type: string
 *      example: 3e698b95efcc669f42ecd3c4a2b9a7fc
 *    - name: redirect_uri  
 *      in: form-data
 *      description: Job to generate token
 *      required: true
 *      type: string
 *      example: http://localhost:3000/librarian/login/callback
 *    - name: scope  
 *      in: form-data
 *      description: Job to generate token
 *      required: true
 *      type: string
 *      example: mail openid profile foo 
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.post('/token', oidc.token());

/**
   * @swagger
   * "/user/auth/logout":
   *   get:
   *     tags:
   *     - Auth-Routers
   *     description: removes all tokens that were issued to the user
   *     operationId: for the URL
   *     produces:
   *     - application/json
   *     parameters:
   *     - name: authorization
   *       in: header
   *       description: Job to logout
   *       required: true
   *       type: string
   *     responses:
   *       '200':
   *         description: create response
   *   post:
   *     tags:
   *     - Auth-Routers
   *     description: for logging out of user by removing access token
   *     operationId: for the URL
   *     produces:
   *     - application/json
   *     parameters:
   *     - name: idtoken
   *       in: body
   *       description: Job to logout
   *       required: true
   *       schema:
   *         "$ref": "#/definitions/postLogout"
   *     responses:
   *       '200':
   *         description: create response
   *         schema:
   *           "$ref": "#/definitions/create"
   */
  

router.get('/logout', oidc.removetokens(), function (req, res, next) {
	//res.redirect('/login');
	//res.render('login', { postUrl: "/user/auth/login", return_url: "" });
	res.send("Logged out successfully");

});

router.post("/logout", function (request: Request, response: Response) {
   log.debug("logout: Headers=" + JSON.stringify(request.headers) + " Body=" + JSON.stringify(request.body));
   authController.logoutUser(request, response);
});


/**
   * @swagger
   * /user/auth/signup:
   *   post:
   *     description: Signup to the application
   *     tags: 
   *      - Auth-Routers   
   *     produces:
   *      - application/json
   *     parameters:       
   *       - name: signup Parameters
   *         description: User's credentials.
   *         in: body
   *         required: true
   *         schema:  
   *           $ref: '#/definitions/signupCreate'
   *     responses:
   *       200:
   *         description: login
   *         schema:   
   *           $ref: '#/definitions/create'
   */

// Local strategies
router.post("/signup", function (request: Request, response: Response) {
	log.debug("signup: " + request);
	authController.registerUser(request, response);
});

/**
 * @swagger
 * "/user/auth/verifySignup":
 *  post:
 *    tags:
 *    - Auth-Routers
 *    description: for verifying signup of a new user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: Job Parameters
 *      in: body
 *      description: Job to verify signup
 *      required: true
 *      schema:
 *        "$ref": "#/definitions/verifySignupCreate"
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.post('/verifySignup', function (request: Request, response: Response, next: any) {
	authController.verifyRegistration(request, response, null);
});

/**
   * @swagger
   * /user/auth/login:
   *   post:
   *     description: Login to the application
   *     tags: 
   *      - Auth-Routers   
   *     produces:
   *      - application/json
   *     parameters:       
   *       - name: Login Parameters
   *         description: User's credentials.
   *         in: body
   *         required: true
   *         schema:  
   *           $ref: '#/definitions/loginCreate'
   *     responses:
   *       200:
   *         description: login
   *         schema:   
   *           $ref: '#/definitions/create'
   */

router.post("/login", function (request: Request, response: Response) {
	log.debug("login: " + request);
	authController.loginUserByBasicCredential(request, response, null);
});

/**
 * @swagger
 * "/user/auth/loginByIp":
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for ip login of a user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: client_id
 *      in: header
 *      description: Job to login by ip
 *      type: string
 *      required: true
 *    - name: client_secret
 *      in: header
 *      description: Job to login by ip
 *      type: string
 *      required: true
 *    - name: clientip
 *      in: header
 *      description: Job to login by ip
 *      type: string
 *      required: true
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.get("/loginByIp", function (request: Request, response: Response) {
	log.debug("loginByIp: " + request);
	authController.loginByIp(request, response);
});

/**
  * @swagger
  * "/user/auth/orcid":
  *  get:
  *   tags:
  *   - Auth-Routers
  *   description: for orcid login of a user
  *   operationId: for the URL
  *   produces:
  *   - application/json
  *   responses:
  *     '200':
  *       description: create response
  *       schema:
  *         "$ref": "#/definitions/create"
 */



// Social strategies
router.get("/orcid", function (request: Request, response: Response) {
	//TODO: get the orcid authentication page
	//response.send("//TODO: get the orcid authentication page");
	log.debug("GET : /orcid");
	authController.getOrcidLogin(request, response);
});

/**
 * @swagger
 * "/user/auth/orcid/callback": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for orcid callback redirection
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/orcid/callback", function (request: Request, response: Response) {
	//TODO: show the response when the user is authenticated from orcid
	//response.send("//TODO: show the response when the user is authenticated from orcid");
	log.debug("GET : /orcid/callback");
	authController.loginOrRegisterUserByOrcid(request, response);
});

/**
 * @swagger
 * "/user/auth/facebook": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for facebook login of a user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/facebook", function (request: Request, response: Response) {
	log.debug("GET : /facebook");
	authController.getFacebookLogin(request, response);
});

/**
 * @swagger
 * "/user/auth/facebook/callback": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for facebook callback redirection
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/facebook/callback", function (request: Request, response: Response) {
	log.debug("GET : /facebook/callback");
	authController.loginOrRegisterUserByFacebook(request, response);
});

/**
 * @swagger
 * "/user/auth/twitter": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for twitter login of a user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/twitter", function (request: Request, response: Response) {
	log.debug("GET : /twitter");
	authController.getTwitterLogin(request, response);
});

/**
 * @swagger
 * "/user/auth/twitter/callback": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for twitter callback redirection
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/twitter/callback", function (request: Request, response: Response) {
	log.debug("GET : /twitter/callback");
	authController.loginOrRegisterUserByTwitter(request, response);
});

/**
 * @swagger
 * "/user/auth/linkedin": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for linkedin login of a user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/linkedin", function (request: Request, response: Response) {
	log.debug("GET : /linkedin");
	authController.getLinkedinLogin(request, response);
});

/**
 * @swagger
 * "/user/auth/linkedin/callback": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for linkedin callback redirection
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/linkedin/callback", function (request: Request, response: Response) {
	log.debug("GET : /linkedin/callback");
	authController.loginOrRegisterUserByLinkedin(request, response);
});

/**
 * @swagger
 * "/user/auth/google": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for google login of a user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/google", function (request: Request, response: Response) {
	log.debug("GET : /google");
	authController.getGoogleLogin(request, response);
});

/**
 * @swagger
 * "/user/auth/google/callback": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for google callback redirection
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.get("/google/callback", function (request: Request, response: Response) {
	log.debug("GET : /google/callback");
	authController.loginOrRegisterUserByGoogle(request, response);
});

/**
 * @swagger
 * "/user/auth/failure": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for failure response
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '400':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create400Error"
   */

// Other functionality
router.get("/failure", function (request: Request, response: Response) {
	response.status(400).send("Authentication failure : Invalid credentials")
});

/**
 * @swagger
 * "/user/auth/success": 
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: for success response
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
   */

router.get("/success", function (request: Request, response: Response) {
	response.send("Authentication success")
});

/**
 * @swagger
 * "/user/auth/registrationverification":
 *  put:
 *    tags:
 *    - Auth-Routers
 *    description: for verification of a new user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: Job Parameters
 *      in: body
 *      description: Job to signup
 *      required: true
 *      schema:
 *        "$ref": "#/definitions/verifySignupCreate"
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.put("/registrationverification", function (request: Request, response: Response) {
	authController.verifyRegistration(request, response, null);
});

/**
 * @swagger
 * "/user/auth/credentials":
 *  put:
 *    tags:
 *    - Auth-Routers
 *    description: for verifying signup of a new user
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: Job Parameters
 *      in: body
 *      description: Job to change password
 *      required: true
 *      schema:
 *        "$ref": "#/definitions/credentialsCreate"
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.put("/credentials", function (request: Request, response: Response) {
	if (request.body.newPassword && request.body.oldPassword && request.body.username) {
		authController.updatePassword(request, response);
	} else {
		response.status(500).send(new ApiResponse(new MetaData("failure", "Missing Parameters"), null));
	}
});

/**
 * @swagger
 * "/user/auth/forgotpassword":
 *  get:
 *    tags:
 *    - Auth-Routers
 *    description: to generate forgotpassword token
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: username
 *      in: header
 *      description: Job to change password if forgotten
 *      required: true
 *      type: string
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 *  post:
 *    tags:
 *    - Auth-Routers
 *    description: to generate forgotpassword token
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: Job Parameters
 *      in: body
 *      description: Job to change password if forgotten
 *      required: true
 *      schema:
 *        "$ref": "#/definitions/postForgotPassword"
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 *  put:
 *    tags:
 *    - Auth-Routers
 *    description: to generate forgotpassword token
 *    operationId: for the URL
 *    produces:
 *    - application/json
 *    parameters:
 *    - name: Job Parameters
 *      in: body
 *      description: Job to change password if forgotten
 *      required: true
 *      schema:
 *        "$ref": "#/definitions/putForgotPassword"
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

// Request forgotPassword Token
router.get("/forgotpassword", function (request: Request, response: Response) {
	authController.generateForgotPasswordToken(request, response);
});

// Verify forgotPassword Token
router.post("/forgotpassword", function (request: Request, response: Response) {
	authController.verifyForgotPasswordToken(request, response);
});

// Update Password if forgotPassword Token was validated
router.put("/forgotpassword", function (request: Request, response: Response) {
	authController.resetPassword(request, response);
});

/**
 * @swagger
 * "/user/auth/authtokenverification":
 *  put:
 *    tags:
 *    - Auth-Routers
 *    description: for verifying signup of a new user
 *    operationId: for the URL
 *    produces:
 *    - application/orcid+json
 *    parameters:
 *    - name: clientip
 *      in: header
 *      description: Job to verify signup
 *      required: true
 *      type: string
 *    - name: token
 *      in: header
 *      description: Job to verify signup
 *      required: true
 *      type: string
 *    - name: cache-control
 *      in: header
 *      description: Job to verify signup
 *      required: true
 *      type: string
 *    - name: Accept
 *      in: header
 *      description: Job to verify signup
 *      required: true
 *      type: string
 *    responses:
 *      '200':
 *        description: create response
 *        schema:
 *          "$ref": "#/definitions/create"
 */

router.put("/authtokenverification", function (request: Request, response: Response) {
	authController.validateAccessToken(request, response);
});


class AuthRouter {

	public static getRouter(): Router {
        return router;
    }

    public static setAuthController(authControllerInstance: IAuthController): void {
        authController = authControllerInstance;
    }

}
export = AuthRouter;