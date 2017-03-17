'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as Q from 'q';
import { User } from "../../../src/model/entity/user";
import { Client } from "../../../src/model/entity/client";
import { Access } from "../../../src/model/entity/access";
import { ITokenManager } from "../../../src/token/interface/tokenmanager";
import { TokenFactory, TokenManagerName } from "../../../src/token/factory";
import { IAccessService } from "../../../src/service/access/interface/access";
import { AccessService } from "../../../src/service/access/impl/access";
import { MockDaoFactory } from "../../mocks/mockDaoFactory";
import { IDaoFactory } from "../../../src/model/dao/iDaoFactory";
import { EntityStubs } from "../../mocks/entityStubs";

describe ('Access Service', () => {
    let accessService : IAccessService;
    let daoFactory : IDaoFactory;

    beforeEach(() => {
        daoFactory = new MockDaoFactory();
        accessService = new AccessService(daoFactory, TokenFactory.getTokenManager(TokenManagerName.JWT));
    });

    it('should insert to access with specific arguments', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        var promise = accessService.insertAccessToken(accessObj);
        assert.equal(accessInsertToDaoStub.calledWith(accessObj), true, "Well should have Been true");
        accessInsertToDaoStub.reset();
        done();
    });

    it('should create access data for the user', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        
        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        
        var promise = accessService.createUserAccessToken(userObj.username, userObj.userType, "user client info", userObj);
        promise.then((data : User) => {
            try {
                assert.equal(data.username, userObj.username);
                assert.isAbove(data.accessToken.length, 0);
                assert.equal(data.accessToken[0].token, accessObj.token);
                assert.equal(data.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
       
        accessInsertToDaoStub.reset();
        accessRemoveDaoStub.reset();
    });

    it('should create access data for the user and client', (done) => {
        let accessObj : Access = EntityStubs.createAnyAccess();
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        let accessRemoveDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().removeAccess;
        let accessInsertToDaoStub : sinon.SinonStub = <any>daoFactory.getAccessDao().insertToAccess;
        let getClientByCLientIdToDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().getClientByClientId;
        accessRemoveDaoStub.returns(Q.resolve(true))
        accessInsertToDaoStub.returns(Q.resolve(accessObj));
        getClientByCLientIdToDaoStub.returns(Q.resolve(clientObj));

        var promise = accessService.createUserAccessTokenForClient(userObj.username, userObj.userType, "user client info", clientObj.clientId, userObj);
        promise.then((data : User) => {
            try {
                assert.equal(data.username, userObj.username);
                assert.isAbove(data.accessToken.length, 0);
                assert.equal(data.accessToken[0].token, accessObj.token);
                assert.equal(data.accessToken[0].idToken, accessObj.idToken);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done();  } catch(e) { done(e); } });

        accessInsertToDaoStub.reset();
        accessRemoveDaoStub.reset();
        getClientByCLientIdToDaoStub.reset();
    });
});