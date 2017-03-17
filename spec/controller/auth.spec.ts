'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as Q from "q";
import * as passport from "passport";
import * as bodyParser from "body-parser";
import { Request, Response } from "express";
import { AuthController } from "../../src/controllers/impl/auth";
import { IAuthController } from "../../src/controllers/interface/auth";
import { AuthService } from "../../src/service/auth/impl/auth";
import { IAuthService } from "../../src/service/auth/interface/auth";
import { IEmailService } from "../../src/service/email/interface/email";
import { EmailServiceFactory } from "../../src/service/email/factory";
import { IAccessService } from "../../src/service/access/interface/access";
import { AccessService } from "../../src/service/access/impl/access";
import { IPassportService } from "../../src/service/passport/interface/passport";
import { PassportService } from "../../src/service/passport/passport";
import { IOIDCService } from "../../src/service/oidc/interface/oidc";
import { OIDCService } from "../../src/service/oidc/impl/oidc";
import { IClientService } from "../../src/service/client/interface/client";
import { ClientService } from "../../src/service/client/impl/client";
import { IUserService } from "../../src/service/user/interface/user";
import { UserService } from "../../src/service/user/impl/user";
import { SMTPEmailService } from "../../src/service/email/impl/smtp/email";
import { User } from "../../src/model/entity/user";
import { Access } from "../../src/model/entity/access";
import { Client } from "../../src/model/entity/client";
import { ITokenManager } from "../../src/token/interface/tokenmanager";
import { TokenFactory, TokenManagerName } from "../../src/token/factory";
import { SessionManager, SessionKeys } from "../../src/util/session";
import { MockDaoFactory } from "../mocks/mockDaoFactory";
import { IDaoFactory } from "../../src/model/dao/iDaoFactory";
import { EntityStubs } from "../mocks/entityStubs";
import { IProfileTransform } from "../../src/profile-transform/interface/profile-transform";
import { ProfileTransformFactory, ProfileName } from "../../src/profile-transform/factory";

let MockRequest = require("mock-express-request");
let MockResponse = require("mock-express-response");
let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;

describe ('User Controller', () => {
    let daoFactory : IDaoFactory;
    let authService : IAuthService;
    let emailService : IEmailService;
    let accessService : IAccessService;
    let oidcService : IOIDCService;
    let clientService : IClientService;
    let userService : IUserService;
    let authController : IAuthController;
    let tokenManager : ITokenManager;
    let request : Request;
    let response : Response;
    let passportService : IPassportService;

    let updateUserDaoStub : sinon.SinonStub;
    let getUserByUserNameDaoStub : sinon.SinonStub;
    let accessRemoveDaoStub : sinon.SinonStub;
    let accessInsertToDaoStub : sinon.SinonStub;
    let findAccessDaoStub : sinon.SinonStub;
    let createUserDaoStub : sinon.SinonStub;
    let getClientByClientIdDaoStub : sinon.SinonStub;

    beforeEach(() => {
        request = new MockRequest();
        response = new MockResponse();
        request.session = <any>{};
        request.body = {};        
        request.params = {};        

        daoFactory = new MockDaoFactory();
        tokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);
        passportService = new PassportService(passport, tokenManager, daoFactory);;
        emailService = <any>sinon.createStubInstance(SMTPEmailService);
        accessService = new AccessService(daoFactory, tokenManager);
        authService = new AuthService(emailService, accessService, daoFactory, tokenManager);
        clientService = new ClientService(daoFactory);
        userService = new UserService(daoFactory, tokenManager);
        oidcService = new OIDCService(clientService, userService, accessService, passportService, daoFactory);
        authController = new AuthController(authService, oidcService, passport);

        updateUserDaoStub = <any>daoFactory.getUserDao().updateUser;
        getUserByUserNameDaoStub = <any>daoFactory.getUserDao().getUserByUserName;
        accessRemoveDaoStub = <any>daoFactory.getAccessDao().removeAccess;
        accessInsertToDaoStub = <any>daoFactory.getAccessDao().insertToAccess;
        findAccessDaoStub = <any>daoFactory.getAccessDao().findAccess;
        createUserDaoStub = <any>daoFactory.getUserDao().createUser;
        getClientByClientIdDaoStub = <any>daoFactory.getClientDao().getClientByClientId;
    });

    afterEach(() => {
        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
        findAccessDaoStub.reset();
        getClientByClientIdDaoStub.reset();
    });

    it('should register user', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            request.body = { userType : userObj.userType, username : userObj.username, password : (<any>userObj.credential).passwordRaw, email : userObj.email, firstName : userObj.firstName, lastName : userObj.lastName };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(null));

            let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
            authController.registerUser(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data.username, expectedResult.data.username);
                assert.notEqual(result.data.id, null);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not register user, when email id is already registered', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            request.body = { userType : userObj.userType, username : userObj.username, password : (<any>userObj.credential).passwordRaw, email : userObj.email, firstName : userObj.firstName, lastName : userObj.lastName };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            let expectedResult = new ApiResponse(new MetaData("failure", {"key":"EMAIL_ADDRESS","value":"Email address is already registered."}), null);
            authController.registerUser(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not register user, when password is not valid', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            request.body = { userType : userObj.userType, username : userObj.username, password : "pwd", email : userObj.email, firstName : userObj.firstName, lastName : userObj.lastName };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            let expectedResult = new ApiResponse(new MetaData("failure", { "key":"PASSWORD", "value":"Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $)." }), null);
            authController.registerUser(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not register user, when username is missing', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            request.body = { userType : userObj.userType, password : (<any>userObj.credential).passwordRaw, email : userObj.email, firstName : userObj.firstName, lastName : userObj.lastName };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            let expectedResult = new ApiResponse(new MetaData("failure", null), { "message" : "Missing credentials" });
            authController.registerUser(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data.message, expectedResult.data.message);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not register user, when username is not valid email address', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            request.body = { userType : userObj.userType, username : "username", password : (<any>userObj.credential).passwordRaw, email : userObj.email, firstName : userObj.firstName, lastName : userObj.lastName };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            let expectedResult = new ApiResponse(new MetaData("failure", { "key" : "EMAIL_ADDRESS", "value" : "Invalid email address." }), null);
            authController.registerUser(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should verify registration', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();

            accessRemoveDaoStub.returns(Q.resolve(true))
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.body = { username : userObj.username, registrationVerificationToken : userObj.registrationVerificationToken };

            let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
            authController.verifyRegistration(request, response, null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data.username, expectedResult.data.username);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should verify registration and pass the user to callback', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();

            accessRemoveDaoStub.returns(Q.resolve(true))
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.body = { username : userObj.username, registrationVerificationToken : userObj.registrationVerificationToken };
            authController.verifyRegistration(request, response, (err : Error, user : User) => {
                assert.equal(user.username, userObj.username);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not verify registration if username is missing', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();

            accessRemoveDaoStub.returns(Q.resolve(true))
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.body = { registrationVerificationToken : userObj.registrationVerificationToken };

            let expectedResult = new ApiResponse(new MetaData("failure", { key: "UNEXPECTED_ERROR", value: "missing parameters : username or registrationverificationtoken not present in request" }), null);
            authController.verifyRegistration(request, response, null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not verify registration if registrationVerificationToken is missing', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();

            accessRemoveDaoStub.returns(Q.resolve(true))
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.body = { username : userObj.username };

            let expectedResult = new ApiResponse(new MetaData("failure", { key: "UNEXPECTED_ERROR", value: "missing parameters : username or registrationverificationtoken not present in request" }), null);
            authController.verifyRegistration(request, response, null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should login user', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            let accessObj : Access = EntityStubs.createAnyAccess();
            request.body = { username : userObj.username, password : (<any>userObj.credential).passwordRaw };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            accessRemoveDaoStub.returns(Q.resolve(accessObj));
            

            let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
            authController.loginUserByBasicCredential(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data.username, expectedResult.data.username);
                assert.notEqual(result.data.id, null);
                assert.isAbove(result.data.accessToken.length, 0);
                assert.equal(result.data.accessToken[0].token, accessObj.token);
                assert.equal(result.data.accessToken[0].idToken, accessObj.idToken);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not register user, when email id is not registered', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            let accessObj : Access = EntityStubs.createAnyAccess();
            request.body = { username : userObj.username, password : (<any>userObj.credential).passwordRaw };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(null));
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            accessRemoveDaoStub.returns(Q.resolve(accessObj));

            let expectedResult = new ApiResponse(new MetaData("failure", {"key":"EMAIL_ADDRESS","value":"Invalid email address."}), null);
            authController.loginUserByBasicCredential(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not register user, when password is not valid', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            let accessObj : Access = EntityStubs.createAnyAccess();
            request.body = { username : userObj.username, password : "pwd" };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            accessRemoveDaoStub.returns(Q.resolve(accessObj));

            let expectedResult = new ApiResponse(new MetaData("failure", { "key" : "PASSWORD", "value" : "Password is incorrect." }), null);
            authController.loginUserByBasicCredential(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not register user, when username is missing', (done) => {
        try {
            let userObj : User = EntityStubs.createAnyUser();
            let accessObj : Access = EntityStubs.createAnyAccess();
            request.body = { password : (<any>userObj.credential).passwordRaw };
            createUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(null));
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            accessRemoveDaoStub.returns(Q.resolve(accessObj));

            let expectedResult = new ApiResponse(new MetaData("failure", null), { "message" : "Missing credentials" });
            authController.loginUserByBasicCredential(request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data.message, expectedResult.data.message);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should login by ip', (done) => {
        try {
            let ipAddress : string = "1.1.1.1";
            let orgData : any = JSON.stringify({ data : { party_id : 1, access_type : "allow", create_token : true }});
            let clientObj : Client = EntityStubs.createAnyClient();
            let accessObj : Access = EntityStubs.createAnyAccess();
            let getOrganizationDetailsStub : sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
            let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);
            let profileData : any = { ipAddress : ipAddress, ipDetails : orgData };
            let userObj : User = profileTransform.createUserFromProfile(profileData);
            userObj.id = (<any>userObj)._id = EntityStubs.randomObjectId();

            request.headers["clientip"] = ipAddress;
            request.headers["client_id"] = clientObj.clientId;
            request.headers["client_secret"] = clientObj.clientSecret;

            getClientByClientIdDaoStub.returns(Q.resolve(clientObj));
            getOrganizationDetailsStub.returns(Q.resolve({ res : { statusCode : 200 }, body : orgData }));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));
            createUserDaoStub.returns(Q.resolve(userObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            accessRemoveDaoStub.returns(Q.resolve(accessObj));
            accessInsertToDaoStub.returns(Q.resolve(accessObj));

            authController.loginByIp(request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data.access_type, "allow");
                assert.equal(result.data.user.userType, userObj.userType);
                assert.equal(result.data.user.userType, userObj.userType);
                assert.isAbove(result.data.user.accessToken.length, 0);
                assert.equal(result.data.user.accessToken[0].token, accessObj.token);
                assert.equal(result.data.user.accessToken[0].idToken, accessObj.idToken);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not login by ip when client not found', (done) => {
        try {
            let ipAddress : string = "1.1.1.1";
            let orgData : any = JSON.stringify({ data : { party_id : 1, access_type : "allow", create_token : true }});
            let clientObj : Client = EntityStubs.createAnyClient();
            let clientObj2 : Client = EntityStubs.createAnyClient();
            let accessObj : Access = EntityStubs.createAnyAccess();
            let getOrganizationDetailsStub : sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
            let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);
            let profileData : any = { ipAddress : ipAddress, ipDetails : orgData };
            let userObj : User = profileTransform.createUserFromProfile(profileData);
            userObj.id = (<any>userObj)._id = EntityStubs.randomObjectId();

            request.headers["clientip"] = ipAddress;
            request.headers["client_id"] = clientObj.clientId;
            request.headers["client_secret"] = clientObj.clientSecret;
            clientObj.clientSecret = clientObj2.clientSecret;
            getClientByClientIdDaoStub.returns(Q.resolve(null));
            getOrganizationDetailsStub.returns(Q.resolve({ res : { statusCode : 200 }, body : orgData }));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));
            createUserDaoStub.returns(Q.resolve(userObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            accessRemoveDaoStub.returns(Q.resolve(accessObj));
            accessInsertToDaoStub.returns(Q.resolve(accessObj));

            authController.loginByIp(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", "Client not found."), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message, expectedResult.metadata.message);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not login by ip when client secret is not correct', (done) => {
        try {
            let ipAddress : string = "1.1.1.1";
            let orgData : any = JSON.stringify({ data : { party_id : 1, access_type : "allow", create_token : true }});
            let clientObj : Client = EntityStubs.createAnyClient();
            let clientObj2 : Client = EntityStubs.createAnyClient();
            let accessObj : Access = EntityStubs.createAnyAccess();
            let getOrganizationDetailsStub : sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
            let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);
            let profileData : any = { ipAddress : ipAddress, ipDetails : orgData };
            let userObj : User = profileTransform.createUserFromProfile(profileData);
            userObj.id = (<any>userObj)._id = EntityStubs.randomObjectId();

            request.headers["clientip"] = ipAddress;
            request.headers["client_id"] = clientObj.clientId;
            request.headers["client_secret"] = clientObj.clientSecret;
            clientObj.clientSecret = clientObj2.clientSecret;
            getClientByClientIdDaoStub.returns(Q.resolve(clientObj));
            getOrganizationDetailsStub.returns(Q.resolve({ res : { statusCode : 200 }, body : orgData }));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));
            createUserDaoStub.returns(Q.resolve(userObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            accessRemoveDaoStub.returns(Q.resolve(accessObj));
            accessInsertToDaoStub.returns(Q.resolve(accessObj));

            authController.loginByIp(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", "clientSecret is not match."), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message, expectedResult.metadata.message);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should logout user', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();

        findAccessDaoStub.returns(Q.resolve([ accessObj ]));
        accessRemoveDaoStub.returns(Q.resolve(null));

        SessionManager.set(request, SessionKeys.User_Details, userObj)
        .then(() => {
            try {
                request.session.destroy = sinon.stub().callsArgWith(0, null);
                request.logout = () => {};
                request.body.idtoken = "idtoken";
                authController.logoutUser(request, response);
                let expectedResult = new ApiResponse(new MetaData("success", null), null);
                EntityStubs.waitForControllerResults(() => {
                    var result = (<any>response)._getJSON();
                    assert.equal(result.metadata.status, expectedResult.metadata.status);
                    done();
                });
            } catch(e) { done(e); }
        })
        .fail((err : Error) => { console.log(JSON.stringify);try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
    });

    it('should generate forgot password token', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.query["username"] = userObj.username;
            authController.generateForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal((<sinon.SinonStub>emailService.sendForgetPasswordMail).called, true);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not generate forgot password token if username is not passed', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(null));

            authController.generateForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "EMAIL_ADDRESS", value: "Email address not present" }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not generate forgot password token if username is not registered', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(null));

            request.query["username"] = userObj.username;
            authController.generateForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "EMAIL_ADDRESS", value: "Email address is not registered." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should verify forgot password token', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.query["username"] = userObj.username;
            request.query["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.generateForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not verify forgot password token if token is wrong', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["username"] = userObj.username;
            request.headers["resetpasswordtoken"] = "wrongToken";
            authController.verifyForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), false);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data, expectedResult.data);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not verify forgot password token if username is not registered', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(null));

            request.headers["username"] = userObj.username;
            request.headers["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.verifyForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "EMAIL_ADDRESS", value: "Email address is not registered." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not verify forgot password token if username is not in headers', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.verifyForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "USER_NAME", value: "username not present in request" }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not verify forgot password token if token is not in headers', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["username"] = userObj.username;
            authController.verifyForgotPasswordToken(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "RESET_PASSWORD_TOKEN", value: "resetPasswordToken not present in request" }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should reset password', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["username"] = userObj.username;
            request.headers["newpassword"] = "Password2!";
            request.headers["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.resetPassword(request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), true);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.data, expectedResult.data);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not reset password when password is missing', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["username"] = userObj.username;
            request.headers["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.resetPassword(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "REQUEST_PARAMETERS", value: "missing parameters" }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not reset password when username is missing', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["newpassword"] = "Password2!";
            request.headers["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.resetPassword(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "REQUEST_PARAMETERS", value: "missing parameters" }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not reset password when user is not registered', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(null));

            request.headers["username"] = userObj.username;
            request.headers["newpassword"] = "Password2!";
            request.headers["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.resetPassword(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "EMAIL_ADDRESS", value: "User not found." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not reset password when reset token is wrong', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["username"] = userObj.username;
            request.headers["newpassword"] = "Password2!";
            request.headers["resetpasswordtoken"] = "wrongToken";
            authController.resetPassword(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "RESET_PASSWORD_TOKEN", value: "resetPasswordToken not validated" }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should not reset password when new password is not valid', (done) => {
        try {
            let accessObj : Access = EntityStubs.createAnyAccess();
            let userObj : User = EntityStubs.createAnyUser();
            userObj.isValidated = true;

            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));

            request.headers["username"] = userObj.username;
            request.headers["newpassword"] = "pass";
            request.headers["resetpasswordtoken"] = (<any>userObj).credential.resetPasswordToken;
            authController.resetPassword(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "NEW_PASSWORD", value: "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $)." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });
});


describe("Login By IP", () => {

    let daoFactory : IDaoFactory;
    let authService : IAuthService;
    let emailService : IEmailService;
    let accessService : IAccessService;
    let oidcService : IOIDCService;
    let clientService : IClientService;
    let userService : IUserService;
    let authController : IAuthController;

    let tokenManager : ITokenManager;
    let request : Request;
    let response : Response;
    let passportService : IPassportService;
    let getClientByClientIdDaoStub : sinon.SinonStub;

    beforeEach(() => {
        request = new MockRequest();
        response = new MockResponse();

        daoFactory = new MockDaoFactory();
        tokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);
        passportService = new PassportService(passport, tokenManager, daoFactory);;
        emailService = <any>sinon.createStubInstance(SMTPEmailService);
        accessService = new AccessService(daoFactory, tokenManager);
        authService = new AuthService(emailService, accessService, daoFactory, tokenManager);
        clientService = new ClientService(daoFactory);
        userService = new UserService(daoFactory, tokenManager);
        oidcService = new OIDCService(clientService, userService, accessService, passportService, daoFactory);
        authController = new AuthController(authService, oidcService, passport);
        getClientByClientIdDaoStub =  <any>daoFactory.getClientDao().getClientByClientId;;
    })

    afterEach(() => {
        getClientByClientIdDaoStub.reset();
    });

    it("should reject the request if the headers don't have client id", done => {
        request.headers["client_secret"] = "secret";
        request.headers["clientip"] = "128.232.000.000";
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        authController.loginByIp(request, response);
        EntityStubs.waitForControllerResults(() => {
            var result = (<any>response)._getJSON();
            assert.equal(result.metadata.status, "failure");
            assert.equal(result.metadata.message, "Client not found.");
            done();
        });
    });


    it("should reject the request if the headers don't have client secret", done => {
        request.headers["client_id"] = "secret";
        request.headers["clientip"] = "128.232.000.000";
        let clientObj : Client = EntityStubs.createAnyClient();
        getClientByClientIdDaoStub.returns(Q.resolve(clientObj));
        authController.loginByIp(request, response);
        EntityStubs.waitForControllerResults(() => {
            var result = (<any>response)._getJSON();
            assert.equal(result.metadata.status, "failure");
            assert.equal(result.metadata.message, "clientSecret is not match.");
            done();
        });
    });

    /**
     * Skipping This Test Case Because don't want to use proxy require
     * @param {[type]}    "should reject                         the request if the headers don't have client                       ip" [description]
     * @param {Client =       EntityStubs.createAnyClient();                                       request.headers["client_id"] =   clientObj.clientId;        request.headers["client_secret"] = clientObj.clientSecret;                getClientByClientIdDaoStub.returns(Q.resolve(clientObj));        authController.loginByIp(request, response);        EntityStubs.waitForControllerResults(() => {            var result = (<any>response)._getJSON();            assert.equal(result.metadata.status, "failure");            assert.equal(result.metadata.message, "clientSecret is not match.");            done();        });    }} done => {        let clientObj [description]
     */
    it.skip("should reject the request if the headers don't have client ip", done => {
        let clientObj : Client = EntityStubs.createAnyClient();

        request.headers["client_id"] = clientObj.clientId;
        request.headers["client_secret"] = clientObj.clientSecret;
        //request.headers["clientip"] = "128.232.000.000";
        getClientByClientIdDaoStub.returns(Q.resolve(clientObj));
        authController.loginByIp(request, response);
        EntityStubs.waitForControllerResults(() => {
            var result = (<any>response)._getJSON();
            assert.equal(result.metadata.status, "failure");
            assert.equal(result.metadata.message, "clientSecret is not match.");
            done();
        });
    });
});