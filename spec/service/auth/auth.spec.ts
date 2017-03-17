'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as Q from 'q';
import { User } from "../../../src/model/entity/user";
import { Client } from "../../../src/model/entity/client";
import { Access } from "../../../src/model/entity/access";
import { IAccessService } from "../../../src/service/access/interface/access";
import { AccessService } from "../../../src/service/access/impl/access";
import { IEmailService } from "../../../src/service/email/interface/email";
import { EmailServiceFactory } from "../../../src/service/email/factory";
import { SMTPEmailService } from "../../../src/service/email/impl/smtp/email";
import { IAuthService } from "../../../src/service/auth/interface/auth";
import { AuthService } from "../../../src/service/auth/impl/auth";
import { MockDaoFactory } from "../../mocks/mockDaoFactory";
import { IDaoFactory } from "../../../src/model/dao/iDaoFactory";
import { EntityStubs } from "../../mocks/entityStubs";
import { ITokenManager } from "../../../src/token/interface/tokenmanager";
import { TokenFactory, TokenManagerName } from "../../../src/token/factory";
import ApplicationConfig = require("../../../src/config/application-config");

describe ('Auth service', () => {
    let authService : IAuthService;
    let emailService : IEmailService;
    let accessService : IAccessService;
    let daoFactory : IDaoFactory;
    let tokenManager : ITokenManager;

    beforeEach(() => {
        daoFactory = new MockDaoFactory();
        tokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);
        emailService = <any>sinon.createStubInstance(SMTPEmailService);
        accessService = new AccessService(daoFactory, tokenManager);
        authService = new AuthService(emailService, accessService, daoFactory, tokenManager);
    });

    it('should get user registered', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        var promise = authService.registerUser(userObj, null);
        promise.then((user : User) => {
            try {
                assert.equal(user.username, userObj.username);
                assert.equal((<sinon.SinonStub>emailService.sendRegistrationMail).called, true);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
    });

    it('should get reject user registration when info details passed and user object is null', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        var promise = authService.registerUser(null, "something happened");
        promise.then((user : User) => {
             try { assert.equal(false, true); done(); } catch(e) { done(e); }
        }).fail((err : any) => { try { assert.equal(err, "something happened"); done(); } catch(e) { done(e); } });
    });

    it('should verify registration token', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.verifyRegistration(userObj.username, userObj.registrationVerificationToken, "user client info");
        promise.then((user : User) => {
            try {
                assert.equal(user.username, userObj.username);
                assert.notEqual(user.accessToken, null);
                assert.isAbove(user.accessToken.length, 0);
                assert.equal(user.accessToken[0].token, accessObj.token);
                assert.equal(user.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not verify registration token when token is wrong', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))
        var promise = authService.verifyRegistration(userObj.username, "wrong token", "user client info");
        promise.then((user : User) => {
            try { assert.equal(false, true); done(); } catch(e) { done(e); } 
        }).fail((err : any) => { 
            try {
                assert.equal(err.status, 409);
                assert.equal(err.key, "VERIFICATION_CODE");
                assert.equal(err.value, "Verification code is incorrect.");
                done();
            } catch(e) { done(e); }   
        });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not verify registration token when token is expired', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.registrationVerificationTokenExpiry = EntityStubs.monthAdd(new Date(), -1).getTime();

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.verifyRegistration(userObj.username, userObj.registrationVerificationToken, "user client info");
        promise.then((user : User) => {
            try { assert.equal(false, true); done(); } catch(e) { done(e); }
        }).fail((err : any) => { 
            try {
                assert.equal(err.status, 409);
                assert.equal(err.key, "VERIFICATION_CODE");
                assert.equal(err.value, "Verification code is expired.");
                done();
            } catch(e) { done(e); }     
        });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not verify registration token user is not found', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.registrationVerificationTokenExpiry = EntityStubs.monthAdd(new Date(), -1).getTime();

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(null))

        var promise = authService.verifyRegistration(userObj.username, userObj.registrationVerificationToken, "user client info");
        promise.then((user : User) => {
            try { assert.equal(false, true); done(); } catch(e) { done(e); }
        }).fail((err : any) => { 
            try {
                assert.equal(err.status, 404);
                assert.equal(err.key, "EMAIL_ADDRESS");
                assert.equal(err.value, "User not found.");
                done();
            } catch(e) { done(e); }     
        });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should generate user access token', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();

        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));

        var promise = authService.loginUserByBasicCredential(userObj, null, "user client info");
        promise.then((user : User) => {
            try {
                assert.equal(user.username, userObj.username);
                assert.notEqual(user.accessToken, null);
                assert.isAbove(user.accessToken.length, 0);
                assert.equal(user.accessToken[0].token, accessObj.token);
                assert.equal(user.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : any) => { try { assert.equal(false, true); done(); } catch(e) { done(e); } });

        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not generate user access token when user is not found', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();

        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));

        var promise = authService.loginUserByBasicCredential(null, "user not found", "user client info");
        promise.then((user : User) => {
            try { assert.equal(false, true); done(); } catch(e) { done(e); }
        }).fail((err : any) => { try { assert.equal(err, "user not found"); done(); } catch(e) { done(e); }});

        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should login by ip if user is present', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginByIp(userObj, "user client info");
        promise.then((data : any) => {
            try {
                let user = data.user;
                assert.equal(data.access_type, "allow");
                assert.equal(user.username, userObj.username);
                assert.notEqual(user.accessToken, null);
                assert.isAbove(user.accessToken.length, 0);
                assert.equal(user.accessToken[0].token, accessObj.token);
                assert.equal(user.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should login by ip if user is not present', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let createUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().createUser;
        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(null))

        var promise = authService.loginByIp(userObj, "user client info");
        promise.then((data : any) => {
            try {
                let user = data.user;
                assert.equal(data.access_type, "allow");
                assert.equal(user.username, userObj.username);
                assert.notEqual(user.accessToken, null);
                assert.isAbove(user.accessToken.length, 0);
                assert.equal(user.accessToken[0].token, accessObj.token);
                assert.equal(user.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not login by ip if user is not validated', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginByIp(userObj, "user client info");
        promise.then((user : User) => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : Error) => {
            try {
                assert.equal(err.message, "user is not validated.");
                done();
            } catch(e) { done(e); }
        });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should login by ip if user is not present', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginByIp(null, "user client info");
        promise.then((data : any) => {
            try {
                let user = data.user;
                assert.equal(data.access_type, "allow");
                assert.equal(user, null);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should login by orcid(with tnfClientId)', (done) => {
        let tnfClientId : string = "RESEARCHER_PORTAL_LOCAL";
        let clientCallbackUrl : string = ApplicationConfig.ORCID_CONFIG.tnfClientUrls[tnfClientId];
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginOrRegisterUserByOrcid(tnfClientId, "user client info", true, null, userObj, null);
        promise.then((data : any) => {
            try {
                assert.notEqual(data.callbackURL, null);
                assert.equal(data.callbackURL, clientCallbackUrl + "?status=success&token=" + accessObj.token);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not login by orcid(with tnfClientId) if any error', (done) => {
        let tnfClientId : string = "RESEARCHER_PORTAL_LOCAL";
        let clientCallbackUrl : string = ApplicationConfig.ORCID_CONFIG.tnfClientUrls[tnfClientId];
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginOrRegisterUserByOrcid(tnfClientId, "user client info", true, new Error("Orcid error"), userObj, null);
        promise.then((data : any) => {
            try {
                assert.notEqual(data.callbackURL, null);
                assert.equal(data.callbackURL, clientCallbackUrl + "?status=failure&error=Orcid error");
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not login by orcid(with tnfClientId) if user not found', (done) => {
        let tnfClientId : string = "RESEARCHER_PORTAL_LOCAL";
        let clientCallbackUrl : string = ApplicationConfig.ORCID_CONFIG.tnfClientUrls[tnfClientId];
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginOrRegisterUserByOrcid(tnfClientId, "user client info", true, null, null, null);
        promise.then((data : any) => {
            try {
                assert.notEqual(data.callbackURL, null);
                assert.equal(data.callbackURL, clientCallbackUrl + "?status=failure&error=nouserfound");
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });


        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should login by orcid(without tnfClientId)', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginOrRegisterUserByOrcid(null, "user client info", false, null, userObj, null);
        promise.then((data : any) => {
            try {
                let user : User = data.user;
                assert.equal(user.username, userObj.username);
                assert.notEqual(user.accessToken, null);
                assert.isAbove(user.accessToken.length, 0);
                assert.equal(user.accessToken[0].token, accessObj.token);
                assert.equal(user.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not login by orcid(without tnfClientId) if any error', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginOrRegisterUserByOrcid(null, "user client info", true, new Error("Orcid error"), userObj, null);
        promise.then((data : any) => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : Error) => {
            try {
                assert.equal(err.message, "Orcid error");
                done();
            } catch(e) { done(e); }
        });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should not login by orcid(without tnfClientId) if user not found', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.loginOrRegisterUserByOrcid(null, "user client info", true, null, null, "User not found");
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((data : any) => {
            try {
                assert.equal(data, "User not found");
                done();
            } catch(e) { done(e); }
        });


        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should logout with specific criteria', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let idToken : string = "idToken";
        let criteria = { idToken: idToken };

        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let findAccessDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().findAccess;
        findAccessDaoStub.returns(Q.resolve([ accessObj ]));
        accessRemoveDaoStub.returns(Q.resolve(null));

        var promise = authService.logoutUser(idToken);
        assert.equal(findAccessDaoStub.calledWith(criteria), true);
        
        accessRemoveDaoStub.reset();
        findAccessDaoStub.reset();
        done();
    });

    it('should generate forgot password token', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.generateForgotPasswordToken(userObj.username)
        promise.then((data : any) => {
            try {
                assert.equal((<sinon.SinonStub>emailService.sendForgetPasswordMail).called, true);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should verify forgot password token', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.verifyForgotPasswordToken(userObj.username, (<any>userObj.credential).resetPasswordToken);
        promise.then((data : any) => {
            try {
                assert.equal(data, true);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should verify forgot password token for wrong token', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.verifyForgotPasswordToken(userObj.username, "wrong token");
        promise.then((data : any) => {
            try {
                assert.equal(data, false);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should erify forgot password token if user not found', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(null))

        var promise = authService.verifyForgotPasswordToken(userObj.username, (<any>userObj.credential).resetPasswordToken);
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.status, 404);
                assert.equal(err.key, "EMAIL_ADDRESS");
                assert.equal(err.value, "Email address is not registered.");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should reset password', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.resetPassword(userObj.username, "Password1!", (<any>userObj.credential).resetPasswordToken);
        promise.then((data : any) => {
            try {
                assert.equal((<sinon.SinonStub>emailService.sendPasswordChangeMail).called, true);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should not reset password if user not found', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(null))

        var promise = authService.resetPassword(userObj.username, "new password", (<any>userObj.credential).resetPasswordToken);
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.status, 404);
                assert.equal(err.key, "EMAIL_ADDRESS");
                assert.equal(err.value, "User not found.");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should not reset password if token is wrong', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.resetPassword(userObj.username, "new password", "wrong token");
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.status, 401);
                assert.equal(err.key, "RESET_PASSWORD_TOKEN");
                assert.equal(err.value, "resetPasswordToken not validated");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should not reset password if password is not valid', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.resetPassword(userObj.username, "new password", (<any>userObj.credential).resetPasswordToken);
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.status, 409);
                assert.equal(err.key, "NEW_PASSWORD");
                assert.equal(err.value, "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $).");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should update password', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.updatePassword(userObj.username, "Password1!", (<any>userObj.credential).passwordRaw);
        promise.then((data : any) => {
            try {
                assert.equal((<sinon.SinonStub>emailService.sendPasswordChangeMail).called, true);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should not update password if user not found', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(null))

        var promise = authService.updatePassword(userObj.username, "new password", "old password");
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.status, 404);
                assert.equal(err.key, "EMAIL_ADDRESS");
                assert.equal(err.value, "User not found.");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should not update password if old and new password are same', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.updatePassword(userObj.username, "new password", "new password");
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.key, "NEW_PASSWORD");
                assert.equal(err.value, "This password is recently used. Please choose a different one.");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should not update password if old password is not correct', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.updatePassword(userObj.username, "new password", "old password");
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.status, 409);
                assert.equal(err.key, "OLD_PASSWORD");
                assert.equal(err.value, "Password is incorrect.");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should not update password if new password is not valid', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.updatePassword(userObj.username, "new password", (<any>userObj.credential).passwordRaw);
        promise.then(() => { try { assert.equal(false, true); done(); } catch(e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.status, 409);
                assert.equal(err.key, "NEW_PASSWORD");
                assert.equal(err.value, "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $).");
                done();
            } catch(e) { done(e); }
        })

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
    });

    it('should login social media user', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.registerOrLoginSocialMedia("socialMedia", false, userObj, "user client info");
        promise.then((user : User) => {
            try {
                assert.equal(user.username, userObj.username);
                assert.notEqual(user.accessToken, null);
                assert.isAbove(user.accessToken.length, 0);
                assert.equal(user.accessToken[0].token, accessObj.token);
                assert.equal(user.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });


        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should login social media user in authorization flow', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        userObj.isValidated = true;

        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj))

        var promise = authService.registerOrLoginSocialMedia("socialMedia", true, userObj, "user client info");
        promise.then((user : User) => {
            try {
                assert.equal(user.username, userObj.username);
                assert.notEqual(user.accessToken, null);
                assert.equal(user.accessToken.length, 0);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });


        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });

    it('should validate access token', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();
        let currentDate = Math.round(new Date().getTime() / 1000);
        userObj.isValidated = true;

        let idToken : any = {
            iss: ApplicationConfig.REDIRECT_CONFIG.identity_ui_base_url,
            sub: userObj.id,
            aud: clientObj.clientId,
            exp: currentDate + 3600,
            iat: currentDate,
            user : userObj
        };
        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        let getUserByUserNameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        let validateAndUpdateAuthTokenDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().validateAndUpdateAuthToken;
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        let getTokenDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().getToken;
        let getClientByClientIdDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().getClientByClientId;

        tokenManager.createJwtToken(idToken, clientObj.clientSecret)
        .then((generatedIdToken : string) => {
            
            accessRemoveDaoStub.returns(Q.resolve(true))
            accessInsertToDaoStub.returns(Q.resolve(accessObj));
            getTokenDaoStub.returns(Q.resolve(accessObj));
            updateUserDaoStub.returns(Q.resolve(userObj));
            getUserByUserNameDaoStub.returns(Q.resolve(userObj));
            validateAndUpdateAuthTokenDaoStub.returns(Q.resolve({ isValidToken : true, idToken : generatedIdToken }));
            getClientByClientIdDaoStub.returns(Q.resolve(clientObj));

            var promise = authService.validateAccessToken("clientIP", generatedIdToken);
            promise.then((data : any) => {
                try {
                    assert.notEqual(data, null);
                    assert.notEqual(data.isValidToken, null);
                    assert.notEqual(data.idToken, null);
                    done();
                } catch(e) { done(e); }
            }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
        })
        .fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });

        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
    });
});