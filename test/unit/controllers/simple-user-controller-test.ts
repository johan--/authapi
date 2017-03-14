let sinon = require('sinon');
let expect    = require("chai").expect;
var assert = require('chai').assert;
import UserDao = require("../../../src/model/mongo/dao/user-dao-mongo");
import SimpleUserController = require("../../../src/controllers/simple-user-controller");
import IUserDao = require("../../../src/model/dao/user-dao");
import IUser = require("../../../src/model/entity/user")
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
         let userApi =util.createUserDao();
         let tokenApi =util.createTokenManagerStub();
         let emailService=util.getEmailService();
         let tokenMock=sinon.mock(tokenApi);
         let userMock=sinon.mock(userApi);
         let emailMock=sinon.mock(emailService);
         let request:Request =new MockExpressRequest();
         let response:Response =new MockExpressResponse();
         let responseMock =  sinon.mock(response);
         let user = util.createAnyUser();
         let helperMock = sinon.mock(Helper);
         
    return {
        userApi : userApi, 
        tokenApi : tokenApi,
        emailService : emailService,
        tokenMock : tokenMock,
        userMock : userMock,
        emailMock : emailMock,
        request : request,
        response : response,
        responseMock : responseMock,
        createAnyUser : util.createAnyUser,
        createAnyUserWithAccessToken : util.createAnyUserWithAccessToken,
        user : user,
        helperMock : helperMock
    }
}
describe("verifyAuthToken",function(){

  it("should verify the auth token and send status as success if the token is valid",function(){
      let StubData=getStubData();
      let token="sometoken";
      StubData.request.headers={
        token:token
      }
      StubData.userMock.expects('validateAndUpdateAuthToken').once().yields(null,true);
      let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
      simpleauthcontroller.verifyAuthToken(StubData.request,StubData.response, function(apiResponse:any){
           expect(apiResponse.metadata.status).to.be.equal("success");       
           expect(apiResponse.data.isValidToken).to.be.true;
      });
      StubData.userMock.verify();
  })
})
describe("List Users ",function(){

    it("should give the list of users after setting their accessToken,credentials,registrationVerificationToken to null",function(){
      let StubData=getStubData();
      let user1:IUser= StubData.createAnyUserWithAccessToken();
      let user2:IUser= StubData.createAnyUserWithAccessToken();
      let users:Array<IUser>=[user1,user2];
      let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
      StubData.userMock.expects('listUser').once().withArgs({}).yields(null,users);
      StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":users});
      simpleauthcontroller.listUser({},StubData.request,StubData.response);
      StubData.userMock.verify();
      StubData.responseMock.verify();
      expect(users[0].accessToken).to.be.null;
      expect(users[0].credential).to.be.null;
      expect(users[0].registrationVerificationToken).to.be.null;
    }); 
});

describe("Get User by id ",function(){
    
        it('should return response with status as success and user when the user dao finds the user by id',function(){
        let StubData = getStubData();
          let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
          StubData.request.authenticatedUser=StubData.user;
          StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":StubData.user});      
          
          simpleauthcontroller.getUserById(StubData.user.id,StubData.request,StubData.response);
          StubData.userMock.verify();
          StubData.responseMock.verify();
          });

    
        it('should return response with status as failure and corresponding message when user dao returns error while finding user by id',function(){
          let StubData = getStubData();
          let id:String = "123";
          let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
          StubData.request.authenticatedUser=StubData.user;
          StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":"Unauthorized : 1"},"data":null});        
          simpleauthcontroller.getUserById(id, StubData.request,StubData.response);
          StubData.userMock.verify();
          StubData.responseMock.verify();
          });

});

describe("update User by id ",function(){
   it('should return status as success and updated user as returned from user dao on update',function(){
         let StubData = getStubData();
         StubData.request.body={username:null,credential:null,accessToken:null};
         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         StubData.request.authenticatedUser=StubData.user;
         StubData.userMock.expects('updateUser').once().withArgs(StubData.user.id,StubData.user).yields(null,StubData.user);
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":StubData.user});        

         simpleauthcontroller.updateUser(StubData.user.id,StubData.user,StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
    });

      it('should return response with status as failure and corresponding message when user dao returns error on update',function(){
         let StubData = getStubData();
         let id : String="123";
         StubData.request.authenticatedUser=StubData.user;
         StubData.request.body={username:null,credential:null,accessToken:null};
         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":"Unauthorized : 1"},"data":null});        

         simpleauthcontroller.updateUser(id,StubData.user,StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
    });


    it('should return response with status as failure and corresponding message when user tryiny to update username',function(){
         let StubData = getStubData();
         StubData.request.authenticatedUser=StubData.user;
         StubData.request.body={username:'anyusername@test.com'}
         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":"username can't be update."},"data":null});        

         simpleauthcontroller.updateUser(StubData.user.id,StubData.user,StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
    });

    it('should return response with status as failure and corresponding message when user tryiny to update credentials',function(){
         let StubData = getStubData();
         StubData.request.authenticatedUser=StubData.user;
         StubData.request.body={credential:'credentials'}
         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":"credential can't be update."},"data":null});        

         simpleauthcontroller.updateUser(StubData.user.id,StubData.user,StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
    });

    it('should return response with status as failure and corresponding message when user tryiny to update access token',function(){
         let StubData = getStubData();
         StubData.request.authenticatedUser=StubData.user;
         StubData.request.body={accessToken:'accesstoken'}
         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":"accesstoken can't be update."},"data":null});        

         simpleauthcontroller.updateUser(StubData.user.id,StubData.user,StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
    });
});

describe("Remove User by id ",function(){
  it('should return response with status as success when the user dao deletes the user successfully',function(){
         let StubData = getStubData();
         StubData.request.authenticatedUser=StubData.user;
         let deletedUser={
            "username":StubData.user.username,
						"firstName":StubData.user.firstName,
						"lastName":StubData.user.lastName,
         }
         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         StubData.userMock.expects('removeUser').once().withArgs(StubData.user.id).yields(null,StubData.user);
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":deletedUser});        

         simpleauthcontroller.removeUser(StubData.user.id,StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
    });

      it('should return response with status as failure with error message when the user dao is not able to delete the user',function(){
        let StubData = getStubData();
         let id : String="123";
         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         StubData.request.authenticatedUser=StubData.user;
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":"Unauthorized : 1"},"data":null});        

         simpleauthcontroller.removeUser(id,StubData.request,StubData.response);
        StubData.userMock.verify();
         StubData.responseMock.verify();
    });
});

describe("Search User",function(){
    it('should return the response with status as success and the data as search result with the data returned by user dao on search',function(){
         let StubData = getStubData();
         let user:IUser=StubData.createAnyUser();
         let users:Array<IUser>=new Array<IUser>();
         users.push(user);

         let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
         let searchCriteria={
           username:user.username
          };
         StubData.userMock.expects('searchUsers').once().withArgs(searchCriteria).yields(null,users);
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":users});        

         simpleauthcontroller.searchUsers(searchCriteria,null,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
    });
    
});

describe("getUserByAuthToken", function () {

  it("should return authenticated user and return acessToken as null", function () {
    let StubData = getStubData();
    StubData.request.authenticatedUser=StubData.user;
    let simpleauthcontroller: SimpleUserController = new SimpleUserController(StubData.userApi);
    StubData.responseMock.expects('send').once()
      .withArgs({ "metadata": { "status": "success", "message": null }, "data": StubData.user });
    simpleauthcontroller.getUserByAuthToken(StubData.request, StubData.response);
    expect(StubData.user.accessToken).to.be.null;
    StubData.responseMock.verify();
  });

  it("should return failure when user is not found", function () {
    let StubData = getStubData();
    StubData.request.authenticatedUser=null;
    let simpleauthcontroller: SimpleUserController = new SimpleUserController(StubData.userApi);
    StubData.responseMock.expects('send').once()
      .withArgs({ "metadata": { "status": "failure", "message": "No user found." }, "data": null});
    simpleauthcontroller.getUserByAuthToken(StubData.request, StubData.response);
    StubData.responseMock.verify();
  });
/*
  it("should return error when no user is found with auth token", function () {
        let StubData = getStubData();
        let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
        let accessTokenValue = "xxx";
        StubData.request.headers = {
          "authtoken":accessTokenValue
        }
        
       StubData.userMock.expects('getUserByAuthToken').once().withArgs({token: accessTokenValue}).yields(null,null);
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"failure","message":"no user found for given authToken:"+accessTokenValue},"data":null});        

         simpleauthcontroller.getUserByAuthToken(StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
  });

  it("should return user if found with valid token but without credential and access token", function () {
        let StubData = getStubData();
        let simpleauthcontroller:SimpleUserController = new SimpleUserController(StubData.userApi);
        let accessTokenValue = "xxx";
        StubData.request.headers = {
          "authtoken":accessTokenValue
        }

        let userReturnedFromDao : IUser = StubData.createAnyUserWithAccessToken();
        userReturnedFromDao.dob = null;
        let expectedUserInResponse = JSON.parse(JSON.stringify(userReturnedFromDao));
        expectedUserInResponse.credential = null;
        expectedUserInResponse.accessToken = null;
        
        StubData.userMock.expects('getUserByAuthToken').once().withArgs({token: accessTokenValue	}).yields(null,userReturnedFromDao);
         StubData.responseMock.expects('send').once().withArgs({"metadata":{"status":"success","message":null},"data":expectedUserInResponse});        

         simpleauthcontroller.getUserByAuthToken(StubData.request,StubData.response);
         StubData.userMock.verify();
         StubData.responseMock.verify();
  });
*/
});

