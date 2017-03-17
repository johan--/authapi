'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as Q from "q";
import { Request, Response } from "express";
import { ClientController } from "../../src/controllers/impl/client";
import { IClientController } from "../../src/controllers/interface/client";
import { ClientService } from "../../src/service/client/impl/client";
import { IClientService } from "../../src/service/client/interface/client";
import { User } from "../../src/model/entity/user";
import { Client } from "../../src/model/entity/client";
import { SessionManager, SessionKeys } from "../../src/util/session";
import { MockDaoFactory } from "../mocks/mockDaoFactory";
import { IDaoFactory } from "../../src/model/dao/iDaoFactory";
import { EntityStubs } from "../mocks/entityStubs";

let MockRequest = require("mock-express-request");
let MockResponse = require("mock-express-response");
let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;

describe ('Client Controller', () => {
    let daoFactory : IDaoFactory;
    let clientService : IClientService;
    let clientController : IClientController;
    let request : Request;
    let response : Response;

    let addClientDaoStub : sinon.SinonStub;
    let getUserByUsernameDaoStub : sinon.SinonStub;
    let removeClientDaoStub : sinon.SinonStub;
    let getClientsByUsernameDaoStub : sinon.SinonStub;
    let updateClientByIdDaoStub : sinon.SinonStub;
    let getClientByIdDaoStub : sinon.SinonStub;;

    beforeEach(() => {
        request = new MockRequest();
        response = new MockResponse();
        request.session = <any>{};
        request.body = {};
        

        daoFactory = new MockDaoFactory();
        clientService = new ClientService(daoFactory);
        clientController = new ClientController(clientService);

        addClientDaoStub = <any>daoFactory.getClientDao().addClient;
        getUserByUsernameDaoStub = <any>daoFactory.getUserDao().getUserByUserName;
        removeClientDaoStub = <any>daoFactory.getClientDao().removeClient;
        getClientsByUsernameDaoStub = <any>daoFactory.getClientDao().getClientsByUsername;
        updateClientByIdDaoStub = <any>daoFactory.getClientDao().updateClientById;
        getClientByIdDaoStub = <any>daoFactory.getClientDao().getClientById;
    });

    afterEach(() => {
        addClientDaoStub.reset();
        getUserByUsernameDaoStub.reset();
        removeClientDaoStub.reset();
        getClientsByUsernameDaoStub.reset();
        updateClientByIdDaoStub.reset();
        getClientByIdDaoStub.reset();
    });

    it('should add client', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        addClientDaoStub.returns(Q.resolve(clientObj));
        getUserByUsernameDaoStub.returns(Q.resolve(userObj))

        try {
            let expectedResult = new ApiResponse(new MetaData("success", null), clientObj);
            SessionManager.set(request, SessionKeys.User_Details, userObj)
            .then(() => {
                try {
                    request.body.appName = clientObj.name;
                    request.body.redirect_uris = clientObj.redirect_uris;
                    clientController.addClient(request, response);
                    let expectedResult = new ApiResponse(new MetaData("success", null), clientObj);
                    EntityStubs.waitForControllerResults(() => {
                        var result = (<any>response)._getJSON();
                        assert.equal(result.metadata.status, expectedResult.metadata.status);
                        assert.notEqual(result.data, null);
                        assert.equal(result.data.clientId, expectedResult.data.clientId);
                        assert.equal(result.data.name, expectedResult.data.name);
                        done();
                    });
                } catch(e) { done(e); }
            })
            .fail((err : Error) => { console.log(JSON.stringify);try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
        } catch(e) { done(e); }
    });

    it('should not add client if no session', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();
        
        try {
            request.body.appName = clientObj.name;
            request.body.redirect_uris = clientObj.redirect_uris;
            clientController.addClient(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "SESSION_ERROR", value: "Your session is expired. Please login before adding client app." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should remove client', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        removeClientDaoStub.returns(Q.resolve(clientObj));

        try {
            let expectedResult = new ApiResponse(new MetaData("success", null), clientObj);
            SessionManager.set(request, SessionKeys.User_Details, userObj)
            .then(() => {
                try {
                    request.body.appName = clientObj.name;
                    request.body.redirect_uris = clientObj.redirect_uris;
                    clientController.removeClient(clientObj.id, request, response);
                    EntityStubs.waitForControllerResults(() => {
                        var result = (<any>response)._getJSON();
                        assert.equal(result.metadata.status, expectedResult.metadata.status);
                        assert.notEqual(result.data, null);
                        assert.equal(result.data.clientId, expectedResult.data.clientId);
                        assert.equal(result.data.name, expectedResult.data.name);
                        done();
                    });
                } catch(e) { done(e); }
            })
            .fail((err : Error) => { console.log(JSON.stringify);try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
        } catch(e) { done(e); }
    });

    it('should not remove client if no session', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();
        
        try {
            clientController.removeClient(clientObj.id, request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "SESSION_ERROR", value: "Your session is expired. Please login before removing client app." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should get clients based on username', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        getClientsByUsernameDaoStub.returns(Q.resolve([ clientObj ]));

        try {
            let expectedResult = new ApiResponse(new MetaData("success", null), [ clientObj ]);
            SessionManager.set(request, SessionKeys.User_Details, userObj)
            .then(() => {
                try {
                    clientController.getClientsByUsername(request, response);
                    EntityStubs.waitForControllerResults(() => {
                        var result = (<any>response)._getJSON();
                        assert.equal(result.metadata.status, expectedResult.metadata.status);
                        assert.notEqual(result.data, null);
                        assert.isAbove(result.data.length, 0);
                        assert.equal(result.data[0].clientId, expectedResult.data[0].clientId);
                        assert.equal(result.data[0].name, expectedResult.data[0].name);
                        done();
                    });
                } catch(e) { done(e); }
            })
            .fail((err : Error) => { console.log(JSON.stringify);try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
        } catch(e) { done(e); }
    });

    it('should not get clients based on username if no session', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();
        
        try {
            clientController.getClientsByUsername(request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "SESSION_ERROR", value: "Your session is expired. Please login again." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should update client', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        updateClientByIdDaoStub.returns(Q.resolve(clientObj));

        try {
            let expectedResult = new ApiResponse(new MetaData("success", null), clientObj);
            SessionManager.set(request, SessionKeys.User_Details, userObj)
            .then(() => {
                try {
                    clientController.updateClientById(clientObj.id, { name : clientObj.name, redirect_uris : clientObj.redirect_uris }, request, response);
                    EntityStubs.waitForControllerResults(() => {
                        var result = (<any>response)._getJSON();
                        assert.equal(result.metadata.status, expectedResult.metadata.status);
                        assert.notEqual(result.data, null);
                        assert.equal(result.data.clientId, expectedResult.data.clientId);
                        assert.equal(result.data.name, expectedResult.data.name);
                        done();
                    });
                } catch(e) { done(e); }
            })
            .fail((err : Error) => { console.log(JSON.stringify);try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
        } catch(e) { done(e); }
    });

    it('should not update client if no session', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();
        
        try {
            clientController.updateClientById(clientObj.id, { name : clientObj.name, redirect_uris : clientObj.redirect_uris }, request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "SESSION_ERROR", value: "Your session is expired. Please login again." }), null);
            EntityStubs.waitForControllerResults(() => {
                var result = (<any>response)._getJSON();
                assert.equal(result.metadata.status, expectedResult.metadata.status);
                assert.equal(result.metadata.message.key, expectedResult.metadata.message.key);
                assert.equal(result.metadata.message.value, expectedResult.metadata.message.value);
                done();
            });
        } catch(e) { done(e); }
    });

    it('should reset client secret', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        getClientByIdDaoStub.returns(Q.resolve(clientObj));
        updateClientByIdDaoStub.returns(Q.resolve(clientObj));

        try {
            let expectedResult = new ApiResponse(new MetaData("success", null), clientObj);
            SessionManager.set(request, SessionKeys.User_Details, userObj)
            .then(() => {
                try {
                    clientController.resetClientSecretById(clientObj.id, request, response);
                    EntityStubs.waitForControllerResults(() => {
                        var result = (<any>response)._getJSON();
                        assert.equal(result.metadata.status, expectedResult.metadata.status);
                        assert.notEqual(result.data, null);
                        assert.equal(result.data.clientId, expectedResult.data.clientId);
                        assert.equal(result.data.name, expectedResult.data.name);
                        done();
                    });
                } catch(e) { done(e); }
            })
            .fail((err : Error) => { console.log(JSON.stringify);try { assert.equal(false, true, err.message); done(); } catch(e) { done(e); } });
        } catch(e) { done(e); }
    });

    it('should not reset client secret if no session', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();
        
        try {
            clientController.resetClientSecretById(clientObj.id, request, response);
            let expectedResult = new ApiResponse(new MetaData("failure", { key: "SESSION_ERROR", value: "Your session is expired. Please login again." }), null);
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