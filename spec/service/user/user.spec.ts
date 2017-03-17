'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as Q from 'q';
import { User } from "../../../src/model/entity/user";
import { Client } from "../../../src/model/entity/client";
import { Access } from "../../../src/model/entity/access";
import { IUserService } from "../../../src/service/user/interface/user";
import { UserService } from "../../../src/service/user/impl/user";
import { MockDaoFactory } from "../../mocks/mockDaoFactory";
import { IDaoFactory } from "../../../src/model/dao/iDaoFactory";
import { EntityStubs } from "../../mocks/entityStubs";
import { ITokenManager } from "../../../src/token/interface/tokenmanager";
import { TokenFactory, TokenManagerName } from "../../../src/token/factory";

describe ('User Service', () => {
    let userService : IUserService;
    let daoFactory : IDaoFactory;

    beforeEach(() => {
        daoFactory = new MockDaoFactory();
        userService = new UserService(daoFactory, TokenFactory.getTokenManager(TokenManagerName.JWT));
    });

    it('should get user form auth token', (done) => {
        let authToken : string = "124345";
        let getUserByAuthTokenDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByAuthToken;

        var promise = userService.getUserByAuthToken(authToken);

        assert.equal(getUserByAuthTokenDaoStub.calledWith(authToken), true);
        getUserByAuthTokenDaoStub.reset();
        done();
    });

    it('should get user list', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let getUserListDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().listUser;
        getUserListDaoStub.returns(Q.resolve([ userObj ]));

        var promise = userService.listUser();
        promise.then((users : Array<User>) => {
            users.forEach(user => {
                try {
                    assert.equal(user.username, null);
                    assert.equal(user.accessToken, null);
                    assert.equal(user.credential, null);
                    assert.equal(user.email, null);
                    assert.equal(user.registrationVerificationToken, null);
                    done();
                 } catch(e) { done(e); }
            });
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done();  } catch(e) { done(e); } });

        getUserListDaoStub.reset();
    });

    it('should update user', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let updateObj = { firstName : userObj.firstName, lastName : userObj.lastName, dob : userObj.dob, jobTitle : userObj.jobTitle, organization : userObj.organization, gender : "M", mobilePhone : userObj.mobilePhone, fax : userObj.fax, address : userObj.address };
        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        updateUserDaoStub.returns(Q.resolve(userObj));

        var promise = userService.updateUser(userObj.id, updateObj);
        assert.equal(updateUserDaoStub.calledWith(userObj.id, updateObj), true);
        updateUserDaoStub.reset();
        done();
    });

    it('should update user with only specific params', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let updateUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().updateUser;
        updateUserDaoStub.returns(Q.resolve(userObj));

        var promise = userService.updateUser(userObj.id, { firstName : userObj.firstName, how : userObj.lastName, are : userObj.lastName, you : userObj.lastName });
        assert.equal(updateUserDaoStub.calledWith(userObj.id, { firstName : userObj.firstName}), true);
        updateUserDaoStub.reset();
        done();
    });

    it('should remove user using id', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let removeUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().removeUser;
        removeUserDaoStub.returns(Q.resolve(userObj));

        var promise = userService.removeUser(userObj.id);
        assert.equal(removeUserDaoStub.calledWith(userObj.id), true);
        removeUserDaoStub.reset();
        done();
    });

    it('should get user using id', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let removeUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserId;
        removeUserDaoStub.returns(Q.resolve(userObj));

        var promise = userService.getUserById(userObj.id);
        assert.equal(removeUserDaoStub.calledWith(userObj.id), true);
        removeUserDaoStub.reset();
        done();
    });

    it('should get user using id and creds and access tokens should be null', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let removeUserDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserId;
        removeUserDaoStub.returns(Q.resolve(userObj));

        var promise = userService.getUserById(userObj.id);
        promise.then((user : User) => {
            try {
                assert.equal(user.username, userObj.username);
                assert.equal(user.accessToken, null);
                assert.equal(user.credential, null);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done();  } catch(e) { done(e); } });
        removeUserDaoStub.reset();
    });
});