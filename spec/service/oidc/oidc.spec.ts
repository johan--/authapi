'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as Q from 'q';
import { Request } from "express";
import * as passport from "passport";

import { IOIDCService, AuthRequestWorkFlow } from "../../../src/service/oidc/interface/oidc";
import { DaoFactory } from "../../../src/model/dao/factory";
import { IDaoFactory } from "../../../src/model/dao/iDaoFactory";
import { IConsentDao } from "../../../src/model/dao/interface/consent-dao";
import { IAuthDao } from "../../../src/model/dao/interface/auth-dao";
import { IRefreshDao } from "../../../src/model/dao/interface/refresh-dao";
import { User } from "../../../src/model/entity/user";
import { Client } from "../../../src/model/entity/client";
import { RefreshToken } from "../../../src/model/entity/refresh-token";
import { Access } from "../../../src/model/entity/access";
import { AuthorizationCode } from "../../../src/model/entity/authcode";
import { AuthorizeRequestData } from "../../../src/model/entity/authorize-request-data";
import { Consent } from "../../../src/model/entity/consent";
import { Logger } from '../../../src/util/logger';
import { Helper } from '../../../src/util/helper';
import { SessionManager, SessionKeys } from '../../../src/util/session';
import { ITokenManager } from '../../../src/token/interface/tokenmanager';
import { TokenFactory, TokenManagerName } from '../../../src/token/factory';
import { IPassportService } from '../../../src/service/passport/interface/passport';
import { PassportService } from '../../../src/service/passport/passport';
import { IClientService } from '../../../src/service/client/interface/client';
import { MockDaoFactory } from "../../mocks/mockDaoFactory";
import { OIDCService } from '../../../src/service/oidc/impl/oidc';
import { EntityStubs } from "../../mocks/entityStubs";
import { AccessToken } from "../../../src/model/entity/access-token";
import { ClientService } from "../../../src/service/client/impl/client";
import { IUserService } from '../../../src/service/user/interface/user';
import { UserService } from "../../../src/service/user/impl/user";
import { IAccessService } from "../../../src/service/access/interface/access";
import { AccessService } from "../../../src/service/access/impl/access";
import { IProfileTransform } from "../../../src/profile-transform/interface/profile-transform";
import { ProfileTransformFactory, ProfileName } from "../../../src/profile-transform/factory";



describe('oidc service', () => {
    let daoFactory: IDaoFactory;
    let tokenManager: ITokenManager;
    let oidcService: IOIDCService;
    let clientService: IClientService;
    let userService: IUserService;
    let accessService: IAccessService;
    let passportService: IPassportService;

    let updateUserDaoStub: sinon.SinonStub;
    let getUserByUserNameDaoStub: sinon.SinonStub;
    let accessRemoveDaoStub: sinon.SinonStub;
    let accessInsertToDaoStub: sinon.SinonStub;
    let findAccessDaoStub: sinon.SinonStub;
    let createUserDaoStub: sinon.SinonStub;
    let getOrganizationDetailsStub: sinon.SinonStub;
    let getAuthBasedOnCodeDaoStub: sinon.SinonStub;
    let getUserByUserIdDaoStub: sinon.SinonStub;
    let createRefreshTokenDaoStub: sinon.SinonStub;
    let insertToAccessDaoStub: sinon.SinonStub;
    let getClientByClientIdDaoStub: sinon.SinonStub;
    let getClientByClientIdAndSecretDaoStub: sinon.SinonStub;
    let getTokenDaoStub :sinon.SinonStub;


    beforeEach(() => {
        tokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);
        daoFactory = new MockDaoFactory();
        clientService = new ClientService(daoFactory);
        userService = new UserService(daoFactory, tokenManager);
        accessService = new AccessService(daoFactory, tokenManager);
        passportService = new PassportService(passport, tokenManager, daoFactory);
        oidcService = new OIDCService(clientService, userService, accessService, passportService, daoFactory);

        getAuthBasedOnCodeDaoStub = <any>daoFactory.getAuthDao().getAuthBasedOnCode;
        getUserByUserIdDaoStub = <any>daoFactory.getUserDao().getUserByUserId;
        createRefreshTokenDaoStub = <any>daoFactory.getRefreshDao().createRefreshToken;
        insertToAccessDaoStub = <any>daoFactory.getAccessDao().insertToAccess;
        getClientByClientIdDaoStub = <any>daoFactory.getClientDao().getClientByClientId;
        getClientByClientIdAndSecretDaoStub = <any>daoFactory.getClientDao().getClientByClientIdAndSecret;
        updateUserDaoStub = <any>daoFactory.getUserDao().updateUser;
        getUserByUserNameDaoStub = <any>daoFactory.getUserDao().getUserByUserName;
        accessRemoveDaoStub = <any>daoFactory.getAccessDao().removeAccess;
        accessInsertToDaoStub = <any>daoFactory.getAccessDao().insertToAccess;
        findAccessDaoStub = <any>daoFactory.getAccessDao().findAccess;
        createUserDaoStub = <any>daoFactory.getUserDao().createUser;
        getTokenDaoStub = <any>daoFactory.getRefreshDao().getToken;
    });

    afterEach(() => {
        updateUserDaoStub.reset();
        getUserByUserNameDaoStub.reset();
        accessRemoveDaoStub.reset();
        accessInsertToDaoStub.reset();
        findAccessDaoStub.reset();
        createUserDaoStub.reset();
    });

    it('should get token details if grant type is authorization_code', function (done) {
        let client: Client = EntityStubs.createAnyClient();

        let ipAddress: string = "1.1.1.1";
        let grantType: string = "authorization_code";
        let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: true } });

        let profileData: any = { ipAddress: ipAddress, ipDetails: orgData };
        let accessObj: Access = EntityStubs.createAnyAccess();

        let profileTransform: IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);

        let userObj: User = profileTransform.createUserFromProfile(profileData);
        userObj.id = EntityStubs.randomObjectId();
        let authObj: AuthorizationCode = EntityStubs.createAuthObject(userObj.id, client.id);
        (<any>authObj).client = client;

        let getOrganizationDetailsStub: sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        getOrganizationDetailsStub.returns(Q.resolve({ res: { statusCode: 200 }, body: orgData }));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        accessRemoveDaoStub.returns(Q.resolve(accessObj));
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createRefreshTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));
        getAuthBasedOnCodeDaoStub.returns(Q.resolve(authObj));
        getClientByClientIdAndSecretDaoStub.returns(Q.resolve(client));
        getUserByUserIdDaoStub.returns(Q.resolve(userObj));
        getTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken));

        var promise = oidcService.token(grantType, authObj.code, accessObj.client, client.clientSecret, authObj.redirectUri, ipAddress);

        promise.then((result: any) => {
            try {
                assert.notEqual(result.access_token, null);
                assert.notEqual(result.access_token, undefined);
                assert.notEqual(result.refresh_token, null);
                assert.notEqual(result.refresh_token, undefined);
                assert.notEqual(result.id_token, null);
                assert.notEqual(result.id_token, undefined);
                done();
            } catch (e) { done(e); }
        }).fail((err: Error) => { try { assert.equal(false, true, err.message); done(); } catch (e) { done(e); } });
    });


     it('should get token details if grant type is refresh_token', function (done) {
        let client: Client = EntityStubs.createAnyClient();

        let ipAddress: string = "1.1.1.1";
        let grantType: string = "refresh_token";
        let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: true } });

        let profileData: any = { ipAddress: ipAddress, ipDetails: orgData };
        let accessObj: Access = EntityStubs.createAnyAccess();

        let profileTransform: IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);

        let userObj: User = profileTransform.createUserFromProfile(profileData);
        userObj.id = EntityStubs.randomObjectId();
        let authObj: AuthorizationCode = EntityStubs.createAuthObject(userObj.id, client.id);
        (<any>authObj).client = client;

        let getOrganizationDetailsStub: sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        getOrganizationDetailsStub.returns(Q.resolve({ res: { statusCode: 200 }, body: orgData }));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        accessRemoveDaoStub.returns(Q.resolve(accessObj));
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createRefreshTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));
        getAuthBasedOnCodeDaoStub.returns(Q.resolve(authObj));
        getClientByClientIdAndSecretDaoStub.returns(Q.resolve(client));
        getUserByUserIdDaoStub.returns(Q.resolve(userObj));
        getTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));

        var promise = oidcService.token(grantType, authObj.code, accessObj.client, client.clientSecret, authObj.redirectUri, ipAddress);

        promise.then((result: any) => {
            try {
                assert.notEqual(result.access_token, null);
                assert.notEqual(result.access_token, undefined);
                assert.notEqual(result.refresh_token, null);
                assert.notEqual(result.refresh_token, undefined);
                assert.notEqual(result.id_token, null);
                assert.notEqual(result.id_token, undefined);
                done();
            } catch (e) { done(e); }
        }).fail((err: Error) => { try { assert.equal(false, true, err.message); done(); } catch (e) { done(e); } });
    });


    it('should not get token details if wrong grant is passed', function (done) {
        let client: Client = EntityStubs.createAnyClient();

        let ipAddress: string = "1.1.1.1";
        let grantType: string = "wrong_grant";
        let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: true } });
       // let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: false } });

        let profileData: any = { ipAddress: ipAddress, ipDetails: orgData };
        let accessObj: Access = EntityStubs.createAnyAccess();

        let profileTransform: IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);

        let userObj: User = profileTransform.createUserFromProfile(profileData);
        userObj.id = EntityStubs.randomObjectId();
        let authObj: AuthorizationCode = EntityStubs.createAuthObject(userObj.id, client.id);
        (<any>authObj).client = client;

        let getOrganizationDetailsStub: sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        getOrganizationDetailsStub.returns(Q.resolve({ res: { statusCode: 200 }, body: orgData }));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        accessRemoveDaoStub.returns(Q.resolve(accessObj));
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createRefreshTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));
        getAuthBasedOnCodeDaoStub.returns(Q.resolve(authObj));
        getClientByClientIdAndSecretDaoStub.returns(Q.resolve(client));
        getUserByUserIdDaoStub.returns(Q.resolve(userObj));
        getTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken));

        var promise = oidcService.token(grantType, authObj.code, accessObj.client, client.clientSecret, authObj.redirectUri, ipAddress);

        promise
        .then((result : any) => { try { assert.equal(false, true); done(); } catch (e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.message, "Not a valid grant_type.");
                done();
            } catch (e) { done(e); }
        });
    });

    
    it('should not get token details if params is not passed', function (done) {
        let client: Client = EntityStubs.createAnyClient();

        let ipAddress: string = "1.1.1.1";
        let grantType: string = "authorization_code";
        let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: true } });
       // let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: false } });

        let profileData: any = { ipAddress: ipAddress, ipDetails: orgData };
        let accessObj: Access = EntityStubs.createAnyAccess();

        let profileTransform: IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);

        let userObj: User = profileTransform.createUserFromProfile(profileData);
        userObj.id = EntityStubs.randomObjectId();
        let authObj: AuthorizationCode = EntityStubs.createAuthObject(userObj.id, client.id);
        (<any>authObj).client = client;

        let getOrganizationDetailsStub: sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        getOrganizationDetailsStub.returns(Q.resolve({ res: { statusCode: 200 }, body: orgData }));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        accessRemoveDaoStub.returns(Q.resolve(accessObj));
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createRefreshTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));
        getAuthBasedOnCodeDaoStub.returns(Q.resolve(authObj));
        getClientByClientIdAndSecretDaoStub.returns(Q.resolve(client));
        getUserByUserIdDaoStub.returns(Q.resolve(userObj));
        getTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken));

        var promise = oidcService.token(null, null, null, null, null, ipAddress);

        promise
        .then((result : any) => { try { assert.equal(false, true); done(); } catch (e) { done(e); } })
        .fail((err : any) => {
            try {
                console.log("The result is: " + JSON.stringify(err));
                assert.equal(err.missingParams[0], "grant_type")
                assert.equal(err.missingParams[1], "code");
                assert.equal(err.missingParams[2], "client_id");
                assert.equal(err.missingParams[3], "client_secret");
                assert.equal(err.missingParams[4], "redirect_uri");
                
                done();
            } catch (e) { done(e); }
        });
    });

    it('should not get token details if status is used', function (done) {
        let client: Client = EntityStubs.createAnyClient();

        let ipAddress: string = "1.1.1.1";
        let grantType: string = "authorization_code";
        let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: true } });

        let profileData: any = { ipAddress: ipAddress, ipDetails: orgData };
        let accessObj: Access = EntityStubs.createAnyAccess();

        let profileTransform: IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);

        let userObj: User = profileTransform.createUserFromProfile(profileData);
        userObj.id = EntityStubs.randomObjectId();
        let authObj: AuthorizationCode = EntityStubs.createAuthObject(userObj.id, client.id);
        (<any>authObj).client = client;
        authObj.status = "used";

        let getOrganizationDetailsStub: sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        getOrganizationDetailsStub.returns(Q.resolve({ res: { statusCode: 200 }, body: orgData }));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        accessRemoveDaoStub.returns(Q.resolve(accessObj));
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createRefreshTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));
        getAuthBasedOnCodeDaoStub.returns(Q.resolve(authObj));
        getClientByClientIdAndSecretDaoStub.returns(Q.resolve(client));
        getUserByUserIdDaoStub.returns(Q.resolve(userObj));
        getTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken));

        var promise = oidcService.token(grantType, authObj.code, accessObj.client, client.clientSecret, authObj.redirectUri, ipAddress);

        promise
        .then((result : any) => { 
                console.log("The resultasf is: " + JSON.stringify(result));try { assert.equal(false, true); done(); } catch (e) { done(e); } })
        .fail((err : any) => {
            try {
                console.log("The result is: " + JSON.stringify(err));
                assert.equal(err.callbackURL, authObj.redirectUri+"?error=invalid_grant&message=Authorization code already used.");
                
                done();
            } catch (e) { done(e); }
        });
    });

    it('should not get token details if auth code is invalid', function (done) {
        let client: Client = EntityStubs.createAnyClient();

        let ipAddress: string = "1.1.1.1";
        let grantType: string = "authorization_code";
        let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: true } });

        let profileData: any = { ipAddress: ipAddress, ipDetails: orgData };
        let accessObj: Access = EntityStubs.createAnyAccess();

        let profileTransform: IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);

        let userObj: User = profileTransform.createUserFromProfile(profileData);
        userObj.id = EntityStubs.randomObjectId();
        let authObj: AuthorizationCode = EntityStubs.createAuthObject(userObj.id, client.id);
        (<any>authObj).client = client;

        let getOrganizationDetailsStub: sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        getOrganizationDetailsStub.returns(Q.resolve({ res: { statusCode: 200 }, body: orgData }));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        accessRemoveDaoStub.returns(Q.resolve(accessObj));
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createRefreshTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));
        getAuthBasedOnCodeDaoStub.returns(Q.resolve(null));
        getClientByClientIdAndSecretDaoStub.returns(Q.resolve(client));
        getUserByUserIdDaoStub.returns(Q.resolve(userObj));
        getTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken));

        var promise = oidcService.token(grantType, authObj.code, accessObj.client, client.clientSecret, authObj.redirectUri, ipAddress);

        promise
        .then((result : any) => { 
                try { assert.equal(false, true); done(); } catch (e) { done(e); } })
        .fail((err : any) => {
            try {
                assert.equal(err.callbackURL, authObj.redirectUri+"?error=invalid_grant&message=Authorization code is invalid.");
                
                done();
            } catch (e) { done(e); }
        });
    });

 it('should not get token details if client id does not match', function (done) {
        let client: Client = EntityStubs.createAnyClient();

        let ipAddress: string = "1.1.1.1";
        let grantType: string = "authorization_code";
        let orgData: any = JSON.stringify({ data: { party_id: 1, access_type: "allow", create_token: true } });

        let profileData: any = { ipAddress: ipAddress, ipDetails: orgData };
        let accessObj: Access = EntityStubs.createAnyAccess();

        let profileTransform: IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);

        let userObj: User = profileTransform.createUserFromProfile(profileData);
        userObj.id = EntityStubs.randomObjectId();
        let authObj: AuthorizationCode = EntityStubs.createAuthObject(userObj.id, client.id);
        (<any>authObj).client = client;

        let getOrganizationDetailsStub: sinon.SinonStub = sinon.stub(passportService.loginByIpCustomStrategy, "getOrganizationDetails");
        getClientByClientIdDaoStub.returns(Q.resolve(null));
        getOrganizationDetailsStub.returns(Q.resolve({ res: { statusCode: 200 }, body: orgData }));
        getUserByUserNameDaoStub.returns(Q.resolve(userObj));
        createUserDaoStub.returns(Q.resolve(userObj));
        updateUserDaoStub.returns(Q.resolve(userObj));
        accessRemoveDaoStub.returns(Q.resolve(accessObj));
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        createRefreshTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken()));
        getAuthBasedOnCodeDaoStub.returns(Q.resolve(authObj));
        getUserByUserIdDaoStub.returns(Q.resolve(userObj));
        getTokenDaoStub.returns(Q.resolve(EntityStubs.createRefreshToken));
        getClientByClientIdAndSecretDaoStub.returns(Q.resolve(EntityStubs.createAnyClient()));

        var promise = oidcService.token(grantType, authObj.code, accessObj.client, client.clientSecret, authObj.redirectUri, ipAddress);

        promise
        .then((result : any) => { 
                console.log("The resultasf is: " + JSON.stringify(result));
                try { assert.equal(false, true); done(); } catch (e) { done(e); } })
        .fail((err : any) => {
            try {
                console.log("The result is: " + JSON.stringify(err));
                assert.equal(err.callbackURL, authObj.redirectUri+"?error=invalid_grant&message=The code was not issued for this client.");
                
                done();
            } catch (e) { done(e); }
        });
    });


});