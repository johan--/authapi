'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as Q from "q";
import { Request, Response } from "express";
import { UserController } from "../../src/controllers/impl/user";
import { IUserController } from "../../src/controllers/interface/user";
import { UserService } from "../../src/service/user/impl/user";
import { IUserService } from "../../src/service/user/interface/user";
import { User } from "../../src/model/entity/user";
import { ITokenManager } from "../../src/token/interface/tokenmanager";
import { TokenFactory, TokenManagerName } from "../../src/token/factory";
import { SessionManager, SessionKeys } from "../../src/util/session";
import { MockDaoFactory } from "../mocks/mockDaoFactory";
import { IDaoFactory } from "../../src/model/dao/iDaoFactory";
import { EntityStubs } from "../mocks/entityStubs";

let MockRequest = require("mock-express-request");
let MockResponse = require("mock-express-response");
let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;

describe ('User Controller', () => {
    let daoFactory : IDaoFactory;
    let userService : IUserService;
    let userController : IUserController;
    let request : Request;
    let response : Response;

    let getUserListDaoStub : sinon.SinonStub;
    let getUserByidDaoStub : sinon.SinonStub;
    let updateUserDaoStub : sinon.SinonStub;
    let removeUserDaoStub : sinon.SinonStub;

    beforeEach(() => {
        request = new MockRequest();
        response = new MockResponse();
        request.session = <any>{};
        

        daoFactory = new MockDaoFactory();
        userService = new UserService(daoFactory, TokenFactory.getTokenManager(TokenManagerName.JWT));
        userController = new UserController(userService);

        getUserListDaoStub = <any>daoFactory.getUserDao().listUser;
        getUserByidDaoStub = <any>daoFactory.getUserDao().getUserByUserId;
        updateUserDaoStub = <any>daoFactory.getUserDao().updateUser;
        removeUserDaoStub = <any>daoFactory.getUserDao().removeUser;
    });

    afterEach(() => {
        getUserListDaoStub.reset();
        getUserByidDaoStub.reset();
        updateUserDaoStub.reset();
        removeUserDaoStub.reset();
    });

    it('should get user from session', (done) => {
        let userObj : User = EntityStubs.createAnyUser();

        SessionManager.set(request, SessionKeys.User_Details, userObj)
        .then(() => {
            try {
                userObj.credential = null;
                userObj.accessToken = null;
                userController.self(request, response);
                let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
                EntityStubs.waitForControllerResults(() => {
                    var result = (<any>response)._getJSON();
                    assert.equal(result.metadata.status, expectedResult.metadata.status);
                    assert.notEqual(result.data, null);
                    assert.equal(result.data.username, expectedResult.data.username);
                    assert.equal(result.data.credential, null);
                    assert.equal(result.data.accessToken, null);
                    done();
                });
            } catch(e) { done(e); }
        })
        .fail((err : Error) => { console.log(JSON.stringify);try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
    });

    it('should not get user if no session', (done) => {
        let userObj : User = EntityStubs.createAnyUser();

        try {
            userController.self(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", null), "No user found.");
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.notEqual(result.metadata.message, "No user found.");
                done();
            });
        } catch(e) { done(e); }
    });

    it('should get list of users', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        getUserListDaoStub.returns(Q.resolve([ userObj ]));

        try {
            userController.listUser(null, request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), [ userObj ]);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.notEqual(result.data, null);
                assert.isAbove(result.data.length, 0);
                assert.equal(result.data[0].username, expectedResult.data[0].username);
                assert.equal(result.data[0].credential, null);
                assert.equal(result.data[0].accessToken, null);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should get user by id', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        getUserByidDaoStub.returns(Q.resolve(userObj));

        try {
            userController.getUserById(userObj.id, request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.notEqual(result.data, null);
                assert.equal(result.data.username, expectedResult.data.username);
                assert.equal(result.data.credential, null);
                assert.equal(result.data.accessToken, null);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should update user by id', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let updateObj = { firstName : userObj.firstName, lastName : userObj.lastName, dob : userObj.dob, jobTitle : userObj.jobTitle, organization : userObj.organization, gender : "M", mobilePhone : userObj.mobilePhone, fax : userObj.fax, address : userObj.address };
        updateUserDaoStub.returns(Q.resolve(userObj));

        try {
            userController.updateUser(userObj.id, updateObj, request, response);
            let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.notEqual(result.data, null);
                assert.equal(result.data.username, expectedResult.data.username);
                assert.equal(result.data.credential, null);
                assert.equal(result.data.accessToken, null);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should remove user by id', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        removeUserDaoStub.returns(Q.resolve(userObj));

        try {
            let expectedResult = new ApiResponse(new MetaData("success", null), userObj);
            userController.removeUser(userObj.id, request, response);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.notEqual(result.data, null);
                assert.equal(result.data.username, expectedResult.data.username);
                done();
            });
        } catch(e) { done(e); }
    });
});