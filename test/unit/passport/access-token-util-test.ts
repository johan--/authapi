let sinon = require('sinon');
let expect    = require("chai").expect;
var assert = require('chai').assert;
import AccessTokenUtil = require("../../../src/passport/access-token-util");
import AccessToken = require("../../../src/model/entity/access-token");
import User = require("../../../src/model/entity/user");
import TestUtil = require("../util/test-util");
import express = require('express');
import {Request, Response} from "express";
import IUser = require("../../../src/model/entity/user");
import mongoose = require('mongoose');
import IAccess = require("../../../src/model/entity/access");
import IClient = require("../../../src/model/entity/client");
import UserFactory = require("../../../src/util/userfactory");
let MockExpressRequest = require('mock-express-request');
let uuid = require("uuid/v4");

let util:TestUtil=new TestUtil();

function getStubData() {

    let userApi = util.createUserDao();
    let clientApi = util.createClientDao();
    let accessApi = util.createAccessDao();
    let tokenApi = util.createTokenManagerStub();
    let emailService = util.getEmailService();
    let tokenMock = sinon.mock(tokenApi);
    let userMock = sinon.mock(userApi);
    let clientApiMock = sinon.mock(clientApi);
    let accessApiMock = sinon.mock(accessApi);
    let emailMock = sinon.mock(emailService);
    let user = util.createAnyUser();
    let request: Request = new MockExpressRequest();
    request.headers = {};

    return {
        userApi: userApi,
        tokenApi: tokenApi,
        clientApi: clientApi,
        accessApi: accessApi,
        emailService: emailService,
        tokenMock: tokenMock,
        userMock: userMock,
        emailMock: emailMock,
        clientApiMock: clientApiMock,
        accessApiMock: accessApiMock,
        createAnyUser: util.createAnyUser,
        user: user,
        request: request,
        createAnyAccess: util.createAnyAccess,
        createAnyClient:util.createAnyClient,
    }
}


describe('AccessTokenUtil', function () {    
    it('should remove expired tokens and add one if not found for user', function(){
        let accessTokens : Array<AccessToken> = [
            util.createSomeAccessToken(null),
            util.createSomeAccessToken(-2000),
            util.createSomeAccessToken(10000),
            util.createSomeAccessToken(-1000)
       ];

       let StubData = getStubData();
       let userType: String = accessTokens[2].type;
       let accessTokenUtil : AccessTokenUtil = new AccessTokenUtil(StubData.userApi, StubData.tokenApi,null,null,null);
       let updatedAccessTokens : Array<AccessToken> = accessTokenUtil.clearExpiredAndCreateNewToken(accessTokens, userType, "xxx","aaa");
       expect(updatedAccessTokens.length).to.equal(3);
       expect(updatedAccessTokens[updatedAccessTokens.length-1].expiry > new Date().getTime()).to.equal(true);
    });

    it('should remove expired tokens and update one if found an existing non expired token for (user+client)', function(){
        let accessTokens : Array<AccessToken> = [
            util.createSomeAccessToken(null),
            util.createSomeAccessToken(-2000),
            util.createSomeAccessToken(10000),
            util.createSomeAccessToken(-1000)
       ];

       let username:String = accessTokens[2].username;
       let client:String = accessTokens[2].clientId;
       let userType: String = accessTokens[2].type;

       let StubData = getStubData();
       let accessTokenUtil : AccessTokenUtil = new AccessTokenUtil(StubData.userApi, StubData.tokenApi,null,null,null);
       StubData.tokenMock.expects('authenticateJwtToken').returns(true);
       let updatedAccessTokens : Array<AccessToken> = accessTokenUtil.clearExpiredAndCreateNewToken(accessTokens,client,username,userType);
       expect(updatedAccessTokens.length).to.equal(2);
       expect(updatedAccessTokens[updatedAccessTokens.length-1].expiry > new Date().getTime()).to.equal(true);
       StubData.tokenMock.verify();
    });

    it('should remove expired tokens and add one if an existing expired token for (user+client)', function(){
        let accessTokens : Array<AccessToken> = [
            util.createSomeAccessToken(null),
            util.createSomeAccessToken(-2000),
            util.createSomeAccessToken(-10000),
            util.createSomeAccessToken(-1000)
       ];

       let username:String = accessTokens[2].username;
       let client:String = accessTokens[2].clientId;
       let userType: String = accessTokens[2].type;
       let StubData = getStubData();
       let accessTokenUtil : AccessTokenUtil = new AccessTokenUtil(StubData.userApi, StubData.tokenApi,null,null,null);
       StubData.tokenMock.expects('authenticateJwtToken').once().returns(true);
       let updatedAccessTokens : Array<AccessToken> = accessTokenUtil.clearExpiredAndCreateNewToken(accessTokens, userType, client,username);
       expect(updatedAccessTokens.length).to.equal(2);
       expect(updatedAccessTokens[updatedAccessTokens.length-1].expiry > new Date().getTime()).to.equal(true);
    });
    
    it("should create and add access token to user when clientId is present in headers",function(){
        let StubData=getStubData();
        let user:IUser=StubData.createAnyUser();
        let done:any;
        let client:IClient=StubData.createAnyClient();
        let access:IAccess=StubData.createAnyAccess();
        StubData.request.headers={
            clientId:"clientid"
        };
        StubData.request.body={
            username:user.username
        }
        let clientid ="clientid";
        user.id="Thisisuserid";
        client.id="ItisClientId";
        StubData.accessApiMock.expects('removeAccess').once().yields(null);
        StubData.clientApiMock.expects('getClientByClientId').once().withArgs(clientid).yields(null,client);
        StubData.accessApiMock.expects('insertToAccess').once().yields(null,access);
        let accessTokenUtil : AccessTokenUtil = new AccessTokenUtil(StubData.userApi, StubData.tokenApi,StubData.accessApi,new UserFactory(),StubData.clientApi);
        accessTokenUtil.createAccessToken(StubData.request,user,function(error: Error, userWithAccess: IUser){});
        StubData.accessApiMock.verify();
        StubData.clientApiMock.verify();
        expect(user.accessToken.length).to.equal(1);
    });

  it('should create and add access token to user when clientdId is not present in headers',function(){
     let StubData=getStubData();
        let user:IUser=StubData.createAnyUser();
        let done:any;
        let client:IClient=StubData.createAnyClient();
        let access:IAccess=StubData.createAnyAccess();
        StubData.request.body={
            username:user.username
        }
        user.id="Thisisuserid";
        client.id="ItisClientId";
        StubData.accessApiMock.expects('removeAccess').once().yields(null);
        StubData.accessApiMock.expects('insertToAccess').once().yields(null,access);
        let accessTokenUtil : AccessTokenUtil = new AccessTokenUtil(StubData.userApi, StubData.tokenApi,StubData.accessApi,new UserFactory(),StubData.clientApi);
        accessTokenUtil.createAccessToken(StubData.request,user,function(error: Error, userWithAccess: IUser){});
        StubData.accessApiMock.verify();
        StubData.clientApiMock.verify();
        expect(user.accessToken.length).to.equal(1);
    });

    it("should return error if any while giving access to user",function(){
        let StubData=getStubData();
        let user:IUser=StubData.createAnyUser();
        let err:Error=new Error("Unexpected error");
        let testErr:Error=null;
         StubData.request.body={
            username:null
        }
        StubData.accessApiMock.expects('insertToAccess').once().yields(err,null);
        let accessTokenUtil : AccessTokenUtil = new AccessTokenUtil(StubData.userApi, StubData.tokenApi,StubData.accessApi,new UserFactory(),StubData.clientApi);
        let callbackFunction=function(error: Error, userWithAccess: IUser){
            testErr=err;
        };
        accessTokenUtil.insertToAccess(StubData.request,null,user,callbackFunction);
        StubData.accessApiMock.verify();
        expect(testErr).to.equal(err);
    });
 /*   it("should update the user with updatedAccessTokens", function(){



        let StubData = getStubData();
        let accessTokens : Array<AccessToken> = [
            util.createSomeAccessToken(null),
            util.createSomeAccessToken(-2000)
       ];
       StubData.user.accessToken = accessTokens;

       let mockUpdatedTokens: Array<AccessToken> = [
            accessTokens[0]
       ];
        let accessTokenUtil : AccessTokenUtil = new AccessTokenUtil(StubData.userApi, StubData.tokenApi,null,null,null);
        let mockClearAndUpdateTokenFunction = sinon.stub(accessTokenUtil,"clearExpiredAndCreateNewToken");
        let updateCallBack = function(err:any,user:User){
           
        }
        StubData.userMock.expects("updateUser").once().withArgs(StubData.user.id, { accessToken: mockUpdatedTokens });
        mockClearAndUpdateTokenFunction.withArgs(accessTokens,"xxx",StubData.user.username).returns(mockUpdatedTokens)
        accessTokenUtil.createAccessToken(null,StubData.user,updateCallBack);
        StubData.userMock.verify();
        sinon.assert.calledWith(mockClearAndUpdateTokenFunction, accessTokens,"xxx",StubData.user.username);

    });*/
    
});