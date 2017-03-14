let sinon = require('sinon');
let expect    = require("chai").expect;
var assert = require('chai').assert;
import ClientDao = require("../../../src/model/mongo/dao/client-dao-mongo");
import SimpleClientController = require("../../../src/controllers/simple-client-controller");
import IClientDao = require("../../../src/model/dao/client-dao");
import IClient = require("../../../src/model/entity/client")
import express = require('express');
import {Request, Response} from "express";
import Address=require("../../../src/model/entity/address");
import AccessToken = require("../../../src/model/entity/access-token");

import Util =  require('../util/test-util');

let MockExpressRequest = require('mock-express-request');
let MockExpressResponse = require('mock-express-response');
import IBasicCredential= require('../../../src/model/entity/basic-credential');
import Helper = require("../../../src/util/helper");

let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;


function getStubData(){
    
     let util:Util=new Util();
         let clientApi =util.createClientDao();
         let tokenApi =util.createTokenManagerStub();
         let emailService=util.getEmailService();
         let tokenMock=sinon.mock(tokenApi);
         let clientMock=sinon.mock(clientApi);
         let emailMock=sinon.mock(emailService);
         let request:Request =new MockExpressRequest();
         let response:Response =new MockExpressResponse();
         let responseMock =  sinon.mock(response);
         let client = util.createAnyClient();
         let helperMock = sinon.mock(Helper);
         
    return {
        clientApi : clientApi, 
        tokenApi : tokenApi,
        emailService : emailService,
        tokenMock : tokenMock,
        clientMock : clientMock,
        emailMock : emailMock,
        request : request,
        response : response,
        responseMock : responseMock,
        createAnyClient : util.createAnyClient,
        client : client,
        helperMock : helperMock
    }
}
describe("Simple-Client-Controller\n", function(){
    describe('addClient\n', function(){
        it('should return response with status as success when client dao successfully show the client Apps', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.request.body={
                "appName": StubData.client.name,
	            "redirect_uris": StubData.client.redirect_uris
            }
            StubData.client.clientId=Helper.generateClientId(StubData.client.name);
            StubData.client.clientSecret=Helper.generateClientSecret(StubData.client.clientId, StubData.client.name);
            StubData.helperMock.expects('generateClientId').once().withArgs(StubData.client.name).returns(StubData.client.clientId);
            StubData.helperMock.expects('generateClientSecret').once().withArgs(StubData.client.clientId,StubData.client.name).returns(StubData.client.clientSecret);
            StubData.request.authenticatedUser=StubData.client;
            StubData.clientMock.expects('addClient').once().withArgs(StubData.client).yields(null,StubData.client);
            StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":StubData.client});
            simpleauthcontroller.addClient(StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
        it('should return response with status as failure when username is not present in session', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.client.username=null;
            StubData.request.authenticatedUser=StubData.client;
            StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":{ key: "SESSION_ERROR", value: "Your session is expired. Please login before adding client app."}},"data":null});
            simpleauthcontroller.addClient(StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
    });

    describe('getClientsByUsername\n', function(){
        it('should return response with status as success and clients with specified client id', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.request.authenticatedUser=StubData.client;
            StubData.clientMock.expects('getClientsByUsername').once().withArgs(StubData.client.username).yields(null,StubData.client);
            StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":StubData.client});
            simpleauthcontroller.getClientsByUsername(StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
    });

    describe('updateClientById\n', function(){
        it('should return response with status as success and updated Client with specified client id', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.request.authenticatedUser=StubData.client;
            StubData.request.body={username:null,clientId:null,clientSecret:null};
            StubData.clientMock.expects('updateClientById').once().withArgs(StubData.client.id,StubData.client).yields(null,StubData.client);
            StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":StubData.client});
            simpleauthcontroller.updateClientById(StubData.client.id, StubData.client, StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
        it('should return response with status as failure when user try to update username of clientApp', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.request.authenticatedUser=StubData.client;
            StubData.request.body={username:"anyUsername",clientId:null,clientSecret:null};
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message":{ key: "SESSION_ERROR", value: "user can update only appName and redirect_uris."}},"data":null});
            simpleauthcontroller.updateClientById(StubData.client.id, StubData.client, StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
        it('should return response with status as failure when user try to update clientId of clientApp', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.request.authenticatedUser=StubData.client;
            StubData.request.body={username:null,clientId:"anyClientId",clientSecret:null};
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message":{ key: "SESSION_ERROR", value: "user can update only appName and redirect_uris."}},"data":null});
            simpleauthcontroller.updateClientById(StubData.client.id, StubData.client, StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
        it('should return response with status as failure when user try to update clientSecret of clientApp', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.request.authenticatedUser=StubData.client;
            StubData.request.body={username:null,clientId:null,clientSecret:"anyClientSecret"};
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message":{ key: "SESSION_ERROR", value: "user can update only appName and redirect_uris."}},"data":null});
            simpleauthcontroller.updateClientById(StubData.client.id, StubData.client, StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
        it('should return response with status as failure when username is not present in session', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.client.username=null;
            StubData.request.authenticatedUser=StubData.client;
            StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":{ key: "SESSION_ERROR", value: "Your session is expired. Please login before updating client."}},"data":null});
            simpleauthcontroller.updateClientById(StubData.client.id, StubData.client, StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
    });

    describe('resetClientSecretById\n', function(){
        /*it('should return response with status as success and rest ClientSecret with specified client id', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.request.authenticatedUser=StubData.client;
            StubData.clientMock.expects('getClientByClientId').once().withArgs(StubData.client.id).yields(null,StubData.client);
            StubData.clientMock.expects('updateClientById').once().withArgs(StubData.client.id).yields(null,StubData.client);
            StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":StubData.client});
            simpleauthcontroller.resetClientSecretById(StubData.client.id,StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });*/
        it('should return response with status as failure when username is not present in session', function(){
            let StubData = getStubData();
            let simpleauthcontroller: SimpleClientController = new SimpleClientController(StubData.clientApi);
            StubData.client.username=null;
            StubData.request.authenticatedUser=StubData.client;
            StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":{ key: "SESSION_ERROR", value: "Your session is expired. Please login before resetting the client secret."}},"data":null});
            simpleauthcontroller.resetClientSecretById(StubData.client.id,StubData.request, StubData.response);
            StubData.clientMock.verify();
            StubData.responseMock.verify();
        });
       
    });

})