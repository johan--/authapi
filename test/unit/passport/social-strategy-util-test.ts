let sinon = require('sinon');
let expect    = require("chai").expect;
var assert = require('chai').assert;
import UserDao = require("../../../src/model/mongo/dao/user-dao-mongo");
import SocialStrategyUtil = require("../../../src/passport/social-strategy-util");
import IUserDao = require("../../../src/model/dao/user-dao");
import IUser = require("../../../src/model/entity/user")
import express = require('express');
import {Request, Response} from "express";
import Util =  require('../util/test-util');
let MockExpressRequest = require('mock-express-request');
let MockExpressResponse = require('mock-express-response');

let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;

function getStubData(){
    
     let util:Util=new Util();
         let userApi =util.createUserDao();
         let userMock=sinon.mock(userApi);
         let request:Request =new MockExpressRequest();
         let response:Response =new MockExpressResponse();
         let responseMock =  sinon.mock(response);
         let user = util.createAnyUser();
         
    return {
        userApi : userApi,
        userMock : userMock,
        request : request,
        response : response,
        responseMock : responseMock,
        createAnyUser : util.createAnyUser,
        createAnyUserWithAccessToken : util.createAnyUserWithAccessToken,
        user : user
    }
}

describe("SocialStrategyUtil\n",function(){
    describe("registerOrLoginSocialUser",function(){
        it("should login the user if social user is found in db by username.", function(){
            let StubData = getStubData();
            let socialStratergy = new SocialStrategyUtil(StubData.userApi);
            let done:any;
            StubData.userMock.expects("getUserByUserName").once().withArgs(StubData.user.username).yields(null,StubData.user);
             let socialStrategyMock = sinon.mock(socialStratergy);
            socialStrategyMock.expects("loginSocialUser").once().withArgs(StubData.user.id, StubData.user, done);
           
            socialStratergy.registerOrLoginSocialUser(StubData.request,StubData.user, done);
            StubData.userMock.verify();
        });

        it("should login the user if social user is found in db by username.", function(){
            let StubData = getStubData();
            let socialStratergy = new SocialStrategyUtil(StubData.userApi);
            let done:any;
            StubData.userMock.expects("getUserByUserName").once().withArgs(StubData.user.username).yields(null,null);
             let socialStrategyMock = sinon.mock(socialStratergy);
            socialStrategyMock.expects("registerSocialUser").once().withArgs(StubData.user, done);
           
            socialStratergy.registerOrLoginSocialUser(StubData.request,StubData.user, done);
            StubData.userMock.verify();
        });
    });
    describe("loginSocialUser",function(){
        it("should successfully login with specified social user id.",function(){
            let StubData = getStubData();
            let socialStratergy = new SocialStrategyUtil(StubData.userApi);
            let done: any = function(){};
            StubData.userMock.expects("updateUser").once().withArgs(StubData.user.id, StubData.user).yields(null,StubData.user);
            socialStratergy.loginSocialUser(StubData.user.id,StubData.user, done);
            StubData.userMock.verify();
        });

        it("should not successfully login without social user id and return null.",function(){
            let StubData = getStubData();
            let socialStratergy = new SocialStrategyUtil(StubData.userApi);
            let done: any = function(){};
            StubData.userMock.expects("updateUser").once().withArgs(null, StubData.user).yields("some error",null);
            socialStratergy.loginSocialUser(null,StubData.user, done);
            StubData.userMock.verify();
        });
    });

    describe("registerSocialUser", function(){
        it("should successfully register the social user.",function(){
            let StubData = getStubData();
            let socialStratergy = new SocialStrategyUtil(StubData.userApi);
            let done: any = function(){};
            StubData.userMock.expects("createUser").once().withArgs(StubData.user).yields(null,StubData.user);
            socialStratergy.registerSocialUser(StubData.user, done);
            StubData.userMock.verify();

        });
    });


});