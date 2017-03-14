let sinon = require('sinon');
let expect = require("chai").expect;

import ITokenGenerator = require('../../../../src/token/tokenmanager');
import IUserDao = require('../../../../src/model/dao/user-dao');
import IClientDao = require('../../../../src/model/dao/client-dao');
import EmailService = require('../../../../src/email/email-service');
import IBasicCredential = require('../../../../src/model/entity/basic-credential');
import express = require('express');
import {Request, Response} from "express";
import IUser = require("../../../../src/model/entity/user");
import IClient = require("../../../../src/model/entity/client");
import IAccess = require("../../../../src/model/entity/access");
import AccessToken = require("../../../../src/model/entity/access-token");
import AccessTokenUtil = require("../../../../src/passport/access-token-util");
import IpStrategyUtil = require("../../../../src/passport/ip-strategy-util");
import SocailStrategyUtil = require("../../../../src/passport/social-strategy-util");
import AuthControllerPassport = require('../../../../src/controllers/passport/auth-controller-passport')
import IPassport = require("../../../../src/passport/passport")
import passport = require("passport");
import Util = require('../../util/test-util');
import EncryptionUtil = require("../../../../src/util/encryption-util");
import Helper = require("../../../../src/util/helper");
import PassportServiceImpl = require("../../../../src/passport/passport-impl");
import ApplicationConfig = require("../../../../src/config/application-config");
import TokenManager= require("../../../../src/token/tokenmanager-impl");
let MockExpressRequest = require('mock-express-request');
let MockExpressResponse = require('mock-express-response');
let stubPassport = sinon.stub(passport, 'authenticate').returns(function () { });

function getStubData() {

    let util: Util = new Util();
    let userApi = util.createUserDao();
    let clientApi = util.createClientDao();
    let accessApi = util.createAccessDao();
    let tokenApi = util.createTokenManagerStub();
    let emailService = util.getEmailService();
    let tokenMock = sinon.mock(tokenApi);
    let userApiMock = sinon.mock(userApi);
    let clientApiMock = sinon.mock(clientApi);
    let accessApiMock = sinon.mock(accessApi);
    let emailMock = sinon.mock(emailService);
    let accessTokenUtil = new AccessTokenUtil(null, null, null, null, null);
    let accessTokenUtilMock = sinon.mock(accessTokenUtil);
    let ipStrategyUtil = new IpStrategyUtil(null);
    let ipStrategyUtilMock = sinon.mock(ipStrategyUtil);
    let request: Request = new MockExpressRequest();
    let response: Response = new MockExpressResponse();
    let responseMock = sinon.mock(response);
    let helperMock = sinon.mock(Helper);
    let socialStrategyUtil =new SocailStrategyUtil(null);
    let socialStrategyUtilMock= sinon.mock(socialStrategyUtil);
    request.body = {};
    request.params = {};
    request.headers = {};
    (<any>request).session = {
        isAuthorizationFlow: false,
        destroy:function ():void{}
    };

    return {
        userApi: userApi,
        clientApi: clientApi,
        accessApi: accessApi,
        tokenApi: tokenApi,
        emailService: emailService,
        tokenMock: tokenMock,
        passportService: {},
        stubPassport,
        userApiMock: userApiMock,
        accessApiMock: accessApiMock,
        emailMock: emailMock,
        request: request,
        response: response,
        responseMock: responseMock,
        createAnyUser: util.createAnyUser,
        createAnyAccess: util.createAnyAccess,
        createAnyUserWithAccessToken: util.createAnyUserWithAccessToken,
        helperMock: helperMock,
        createSomeAccessToken: util.createSomeAccessToken,
        accessTokenUtil,
        accessTokenUtilMock,
        ipStrategyUtil,
        ipStrategyUtilMock,
        socialStrategyUtil,
        socialStrategyUtilMock,
    }
}

describe(" Passport auth controller", function () {

 describe("generateForgotPasswordToken",function(){
    it('should generate forgot password token', function () {

        let StubData = getStubData();


        let token: String = "someToken123"
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        StubData.request.query = {
            username: user.username
        }

        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = token;

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        StubData.tokenMock.expects('generateRandomToken').once().returns(token);
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(user.username).yields(null, user);
        let mockedUpdatedUser = JSON.parse(JSON.stringify(user));
        mockedUpdatedUser.credential = credential;
        StubData.userApiMock.expects('updateUser').once().withArgs(user.id, { credential: credential }).yields(null, mockedUpdatedUser);
        StubData.emailMock.expects('sendForgetPasswordMail').once().withArgs(mockedUpdatedUser);
        StubData.responseMock.expects('send').once();
        authControllerPassPort.generateForgotPasswordToken(StubData.request, StubData.response);
        StubData.tokenMock.verify();
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();

    });

    it('should return error in response if the userdao returns an error while generating forgot password token', function () {
        let StubData = getStubData();
        let token: String = "someToken123"
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        StubData.request.query = {
            username: user.username
        }

        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = token;

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        StubData.tokenMock.expects('generateRandomToken').once().returns(token);
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(user.username).yields(new Error("some error in get user by name"), null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "some error in get user by name" } }, "data": null });

        StubData.request.body = { "username": "someuser@test.com" };
        authControllerPassPort.generateForgotPasswordToken(StubData.request, StubData.response);
        StubData.tokenMock.verify();
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();
    });
});

describe("resetPassowrd",function(){

    it('should return error when new password does not meets the standards in reset password', function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        let token: String = "validated!";
        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = token;
        StubData.request.body = {
            username: user.username,
            resetPasswordToken: token,
            newPassword: 'Passwor5'
        }

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);

        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null, user);

        let mockedUpdatedUser = JSON.parse(JSON.stringify(user));
        mockedUpdatedUser.credential = credential;
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "NEW_PASSWORD", value: "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $)." } }, "data": null });
        authControllerPassPort.resetPassword(StubData.request, StubData.response);

        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();
    });

    it('should return error when resetPasswordToken mismatch in reset password', function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        let token: String = "someToken123";
        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = token;
        StubData.request.body = {
            username: user.username,
            resetPasswordToken: "some other token",
            newPassword: credential.password
        }

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null, user);

        let mockedUpdatedUser = JSON.parse(JSON.stringify(user));
        mockedUpdatedUser.credential = credential;
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "RESET_PASSWORD_TOKEN", value: "resetPasswordToken not validated" } }, "data": null });
        authControllerPassPort.resetPassword(StubData.request, StubData.response);

        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();
    });

    it('should reset password if the reset password token is validated', function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        let token: String = "validated!";
        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = token;
        StubData.request.body = {
            username: user.username,
            resetPasswordToken: token,
            newPassword: credential.password
        }

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);

        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null, user);

        let mockedUpdatedUser = JSON.parse(JSON.stringify(user));
        mockedUpdatedUser.credential = credential;
        StubData.userApiMock.expects('updateUser').once().withArgs(user.id, { credential: credential }).yields(null, mockedUpdatedUser);
        StubData.emailMock.expects('sendPasswordChangeMail').once().withArgs(mockedUpdatedUser);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": user.username });
        authControllerPassPort.resetPassword(StubData.request,StubData.response);
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();
    });

    it("should send error if any while getting user by username",function(){
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        let token: String = "validated!";
        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = token;
        StubData.request.body = {
            username: user.username,
            resetPasswordToken: token,
            newPassword: credential.password
        }
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(new Error("Error while getting user"),null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "Error while getting user" } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.resetPassword(StubData.request,StubData.response);
        StubData.userApiMock.verify();
        StubData.responseMock.verify();
    });

    it("should return error if username or newPassword is missing from parameters",function(){
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        let token: String = "validated!";
        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = token;
        StubData.request.body = {
            username: user.username,
            resetPasswordToken: token,
            newPassword: null
        }
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "missing parameters" } }, "data": null });
        authControllerPassPort.resetPassword(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });
});

describe("registerUser", function () {

    it("should use passport local-signup , send  success email and send user details in response if the strategy creates the user", function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        StubData.stubPassport.yields(null, user, null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.registerUser(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should use passport local-signup and the validation error if thrown by the strategy while creating user and ", function () {
        let StubData = getStubData();
        StubData.stubPassport.yields(new Error("can't create user"), null, null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "can't create user" } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.registerUser(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should use passport local-signup and return error in response if the strategy is not able to create user", function () {
        let StubData = getStubData();
        StubData.stubPassport.yields(null, null, "No user Exist");
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": "No user Exist" }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.registerUser(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

});

describe("verifyRegistration", function () {

    it("should return error in response if username is not present in request", function () {
        let StubData = getStubData();
        StubData.request.body = {
            registrationVerificationToken: "xxxx"
        }
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "missing parameters : username or registrationverificationtoken not present in request" } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyRegistration(StubData.request, StubData.response, null);
        StubData.responseMock.verify();
    });

    it("should return error in response if registrationVerificationToken is not present in request", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx"
        }
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "missing parameters : username or registrationverificationtoken not present in request" } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyRegistration(StubData.request, StubData.response, null);
        StubData.responseMock.verify();
    });

    it("should return error in response if username is not present in system", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx",
            registrationVerificationToken: "xxxx"
        }
        StubData.userApiMock.expects("getUserByUserName").once().withArgs(StubData.request.body.username).yields(null, null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "EMAIL_ADDRESS", value: "User not found." } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyRegistration(StubData.request, StubData.response, null);
        StubData.userApiMock.verify();
        StubData.responseMock.verify();
    });

    it("should return error in response if registrationVerificationToken for user doesnt match", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx",
            registrationVerificationToken: "xxxx"
        }
        let user: IUser = StubData.createAnyUser();
        user.registrationVerificationToken = StubData.request.body.registrationVerificationToken + "XX";
        user.registrationVerificationTokenExpiry = new Date().getTime() + 10000;
        StubData.userApiMock.expects("getUserByUserName").once().withArgs(StubData.request.body.username).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "VERIFICATION_CODE", value: "Verification code is incorrect." } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyRegistration(StubData.request, StubData.response, null);
        StubData.userApiMock.verify();
        StubData.responseMock.verify();
    });

    it("should return error in response if registrationVerificationToken for user is expired", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx",
            registrationVerificationToken: "xxxx"
        }
        let user: IUser = StubData.createAnyUser();
        user.registrationVerificationToken = StubData.request.body.registrationVerificationToken;
        user.registrationVerificationTokenExpiry = new Date().getTime() - 10000;
        StubData.userApiMock.expects("getUserByUserName").once().withArgs(StubData.request.body.username).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "VERIFICATION_CODE", value: "Verification code is incorrect." } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyRegistration(StubData.request, StubData.response, null);
        StubData.userApiMock.verify();
        StubData.responseMock.verify();
    });

    it("should updated the registration verification to true and email the user notifying about successfull verification and return success in response if the verification token is valid for user", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx",
            registrationVerificationToken: "xxxx"
        }
        let user: IUser = StubData.createAnyUser();
        user.registrationVerificationToken = StubData.request.body.registrationVerificationToken;
        user.registrationVerificationTokenExpiry = new Date().getTime() + 10000;
        StubData.userApiMock.expects("getUserByUserName").once().withArgs(StubData.request.body.username).yields(null, user);
        StubData.userApiMock.expects("updateUser").once().withArgs(user.id, { registrationVerificationToken: null, isValidated: true }).yields(null, user);
        StubData.accessTokenUtilMock.expects("createAccessToken").once().withArgs(StubData.request, user).yields(null, user);
        StubData.emailMock.expects("sendRegistrationConfirmationMail").once().withArgs(user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, StubData.accessTokenUtil, null);
        authControllerPassPort.verifyRegistration(StubData.request, StubData.response, null);
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();
    });

});

describe("loginUserByBasicCredential", function(){

  it("should use local-login and return error in response if error is thrown by the strategy while creating user",function(){
     let StubData=getStubData();
     StubData.stubPassport.yields(new Error(),null,null)
     StubData.responseMock.expects('send').once().withArgs('error');
     let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, StubData.accessTokenUtil, null);
     authControllerPassPort.loginUserByBasicCredential(StubData.request,StubData.response,null);
     StubData.responseMock.verify();
  });
  
  it("should use local-login and return error in response if error is thrown by the strategy while creating user",function(){
     let StubData=getStubData();
     StubData.stubPassport.yields(null,null,"Incorrect Credentials");
     StubData.responseMock.expects('send').once().withArgs({"metadata": {"status": "failure", "message": "Incorrect Credentials"}, "data": null});
     let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, StubData.accessTokenUtil, null);
     authControllerPassPort.loginUserByBasicCredential(StubData.request,StubData.response,null);
     StubData.responseMock.verify();
  });

  it("should use local-login and return user with access token if user is validated",function(){
     let StubData=getStubData();
     let user: IUser=StubData.createAnyUser();
     StubData.stubPassport.yields(null,user,null);
     user.isValidated=true;
     StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request,user).yields(null,user);
     StubData.responseMock.expects('send').once().withArgs({"metadata": {"status": "success", "message": null}, "data": user});
     let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, StubData.accessTokenUtil, null);
     authControllerPassPort.loginUserByBasicCredential(StubData.request,StubData.response,null);
     StubData.accessTokenUtilMock.verify();
     StubData.responseMock.verify();
  });

  it("should use local-login and return user without access if user is not validated",function(){
     let StubData=getStubData();
     let user: IUser=StubData.createAnyUser();
     StubData.stubPassport.yields(null,user,null);
     StubData.responseMock.expects('send').once().withArgs({"metadata": {"status": "success", "message": null}, "data": user});
     let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, StubData.accessTokenUtil, null);
     authControllerPassPort.loginUserByBasicCredential(StubData.request,StubData.response,null);
     StubData.responseMock.verify();
  });
});

describe("loginByIp", function () {

    it("should use passport ip-custom and give error if thrown by the strategy while creating user and set the access_type to deny", function () {
        let StubData = getStubData();
        StubData.stubPassport.yields(new Error("can't create user"), null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": "can't create user" }, "data": { access_type: "deny", user: null } });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, StubData.ipStrategyUtil, StubData.accessTokenUtil, null);
        authControllerPassPort.loginByIp(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should use passport ip-custom and send response with success status and null user when user no user found", function () {
        let StubData = getStubData();
        StubData.stubPassport.yields(null, null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": { access_type: "allow", user: null } });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, StubData.ipStrategyUtil, StubData.accessTokenUtil, null);
        authControllerPassPort.loginByIp(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should use passport ip-custom and send response with failure if created user is not validated", function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        StubData.stubPassport.yields(null, user);
        StubData.ipStrategyUtilMock.expects('registerOrLoginIpUser').once().withArgs(StubData.request, user).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": "token is not valid." }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, StubData.ipStrategyUtil, StubData.accessTokenUtil, null);
        authControllerPassPort.loginByIp(StubData.request, StubData.response);
        StubData.ipStrategyUtilMock.verify();
        StubData.responseMock.verify();
    });

    it("should use passport ip-custom and send response with success if created user is validated", function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.isValidated = true;
        StubData.stubPassport.yields(null, user);
        StubData.ipStrategyUtilMock.expects('registerOrLoginIpUser').once().withArgs(StubData.request, user).yields(null, user);
        StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request, user).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": { access_type: "allow", user: user } });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, StubData.ipStrategyUtil, StubData.accessTokenUtil, null);
        authControllerPassPort.loginByIp(StubData.request, StubData.response);
        StubData.ipStrategyUtilMock.verify();
        StubData.accessTokenUtilMock.verify();
        StubData.responseMock.verify();
    });
});

describe("getOrcidLogin",function(){
   it("should redirect to orcid login page",function(){
     let StubData= getStubData();
     StubData.responseMock.expects('redirect').once().withArgs(ApplicationConfig.ORCID_CONFIG.authorizationURL);
     let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
     authControllerPassPort.getOrcidLogin(StubData.request,StubData.response);
     StubData.responseMock.verify();
   });

   it("should redirect to orcid login page with client id in URL",function(){
     let StubData =getStubData();
     StubData.request.query={
         clientId:3123132423543534
     }
     StubData.responseMock.expects('redirect').once().withArgs(ApplicationConfig.ORCID_CONFIG.authorizationURL + "&state=" + StubData.request.query.clientId);
     let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
     authControllerPassPort.getOrcidLogin(StubData.request,StubData.response);
     StubData.responseMock.verify();
   });
});

describe("loginOrRegisterUserByOrcid",function(){
   it("should redirect to error page when state and error are there in request query",function(){
      let StubData =getStubData();
      StubData.request.query={
          state:1234568,
          error:"someError"
      }
      StubData.responseMock.expects('redirect').withArgs(ApplicationConfig.ORCID_CONFIG.tnfClientUrls[StubData.request.query.state]+ "?status=failure&error=" +StubData.request.query.error);
      let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
      authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request,StubData.response);
      StubData.responseMock.verify();
   });

   it("should redirect to error page when error is generated while authenticating using orcid-custom strategy",function(){
      let StubData =getStubData();
      StubData.request.query={
          state:1234568
      }
      StubData.stubPassport.yields(new Error("Error while authenticating"),null,null);
      StubData.responseMock.expects('redirect').withArgs(ApplicationConfig.ORCID_CONFIG.tnfClientUrls[StubData.request.query.state]+ "?status=failure&error=" + "Error while authenticating");
      let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
      authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request,StubData.response);
      StubData.responseMock.verify();
   });

   it("should redirect to nouserfound page if user is not created while authentication",function(){
      let StubData =getStubData();
      StubData.request.query={
          state:1234567
      }
      StubData.stubPassport.yields(null,null,null);
      StubData.responseMock.expects('redirect').withArgs(ApplicationConfig.ORCID_CONFIG.tnfClientUrls[StubData.request.query.state]+ "?status=failure&error=nouserfound");
      let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport,  StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
      authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request,StubData.response);
      StubData.responseMock.verify();
   });

   it("should redirect when user is not validated",function(){
       let StubData =getStubData();
       let user:IUser = StubData.createAnyUserWithAccessToken();
       StubData.request.query={
          state:1234567
       }
       StubData.stubPassport.yields(null,user,null);
       StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
       StubData.responseMock.expects('redirect').once().withArgs(ApplicationConfig.ORCID_CONFIG.tnfClientUrls[StubData.request.query.state]+ "?status=success&token=" +user.accessToken[user.accessToken.length - 1].token);
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
       authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request,StubData.response);
       StubData.socialStrategyUtilMock.verify();
       StubData.responseMock.verify();
   });

   it("should redirect and give access to user when user is validated",function(){
       let StubData =getStubData();
       let user:IUser = StubData.createAnyUserWithAccessToken();
       StubData.request.query={
          state:1234567
       }
       user.isValidated=true;
       StubData.stubPassport.yields(null,user,null);
       StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
       StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request,user).yields(null,user);
       StubData.responseMock.expects('redirect').once().withArgs(ApplicationConfig.ORCID_CONFIG.tnfClientUrls[StubData.request.query.state]+ "?status=success&token=" +user.accessToken[user.accessToken.length - 1].token);
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
       authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request,StubData.response);
       StubData.accessTokenUtilMock.verify();
       StubData.socialStrategyUtilMock.verify();
       StubData.responseMock.verify();
   });

   it("should send an error if any while creating user with using orcid-custom strategy when state is not present in request query",function(){
      let StubData =getStubData();
      StubData.request.query={
          state:null
       }
      StubData.stubPassport.yields(new Error("Error while creating user"),null,null);
      StubData.responseMock.expects('send').withArgs({"metadata": {"status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "Error while creating user" }}, "data": null});
      let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
      authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request,StubData.response);
      StubData.responseMock.verify();
   });

   it("should send response with faliure status if no user found using orcid-custom strategy when state is not present in request query",function(){
      let StubData =getStubData();
      StubData.request.query={
          state:null
       }
      StubData.stubPassport.yields(null,null,"No user found");
      StubData.responseMock.expects('send').withArgs({"metadata": {"status": "failure", "message": "No user found"}, "data": null});
      let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
      authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request,StubData.response);
      StubData.responseMock.verify();
   });

   it("should redirect to authorize user page if isAuthorizationFlow is true in request session", function () {
       let StubData = getStubData();
       let user: IUser = StubData.createAnyUser();
       StubData.request.query = {
           state: null
       };
       (<any>StubData.request).session = {
           isAuthorizationFlow: true
       }
       StubData.stubPassport.yields(null, user, null);
       StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request, user).yields(null, user);
       StubData.responseMock.expects('redirect').once().withArgs("/user/auth/authorize?step2=true");
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
       authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request, StubData.response);
       StubData.socialStrategyUtilMock.verify();
       StubData.responseMock.verify();
   });

   it("should create access token is isAuthorizationFlow is not true but user is validated",function(){
       let StubData = getStubData();
       let user: IUser = StubData.createAnyUser();
       user.isValidated = true;
       StubData.request.query = {
           state: null
       };
       StubData.stubPassport.yields(null, user, null);
       StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request, user).yields(null, user);
       StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request, user).yields(null,user);
       StubData.responseMock.expects('send').once().withArgs({ error: null, user: user });
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
       authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request, StubData.response);
       StubData.socialStrategyUtilMock.verify();
       StubData.accessTokenUtilMock.verify();
       StubData.responseMock.verify();
   });

   it("should send user without access if user is not validated and isAuthorizationFlow is not true in request session",function(){
      let StubData = getStubData();
       let user: IUser = StubData.createAnyUser();
       StubData.request.query = {
           state: null
       };
       StubData.stubPassport.yields(null, user, null);
       StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request, user).yields(null, user);
       StubData.responseMock.expects('send').once().withArgs({ error: null, user: user });
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
       authControllerPassPort.loginOrRegisterUserByOrcid(StubData.request, StubData.response);
       StubData.socialStrategyUtilMock.verify();
       StubData.responseMock.verify();
   }); 
});

describe("logout", function () {

    it("should return error if the access token is not present in request header", function () {
        let StubData = getStubData();
        StubData.request.headers = {}

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);

        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "ACCESS_TOKEN", value: "TOKEN not present in request" } }, "data": null });
        authControllerPassPort.logoutUser(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

   /*it("should return error if the access token is not found in system", function () {
        let StubData = getStubData();
        StubData.request.headers = {
            "authtoken": "xxx"
        }
        console.log("stub request headers : " + JSON.stringify(StubData.request.headers));
        //let access: IAccess = StubData.createAnyAccess();
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        // StubData.userApiMock.expects("getUserByAuthToken").once().withArgs({token: StubData.request.headers["authtoken"]}).yields(null,null);
        StubData.accessApiMock.expects("findAccess").once().withArgs({ token: StubData.request.headers["authtoken"] }).yields(new Error, null)
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "ACCESS_TOKEN", value: "Token not found in application." } }, "data": null });
        authControllerPassPort.logoutUser(StubData.request, StubData.response);
        StubData.responseMock.verify();
        StubData.userApiMock.verify();
    }); 

    it("should remove the access token if found", function () {
        let StubData = getStubData();
        let accessTokenValue = "xxx";
        StubData.request.headers = {
            "authtoken": accessTokenValue
        }
        StubData.request.logout = function (): void { };
        let user: IUser = StubData.createAnyUserWithAccessToken();
        user.dob = null;
        user.accessToken[0].token = accessTokenValue;
        console.log("stub request headers : " + JSON.stringify(StubData.request.headers));
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        // StubData.userApiMock.expects("getUserByAuthToken").once().withArgs({token: accessTokenValue}).yields(null,user);
        let access: IAccess = StubData.createAnyAccess();
        // StubData.userApiMock.expects("updateUser").once().withArgs(user.id, { accessToken: []}).yields(null,updatedUser);
        StubData.accessApiMock.expects("findAccess").once().withArgs({ token: StubData.request.headers["authtoken"] }).yields(null, access),
            StubData.accessApiMock.expects("removeAccess").once().withArgs({ token: StubData.request.headers["authtoken"] }).yields(null),
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": "User access token removed!" }, "data": null });
        authControllerPassPort.logoutUser(StubData.request, StubData.response);
        StubData.responseMock.verify();
        StubData.userApiMock.verify();
    });*/
});

describe("generateForgotPasswordToken",function(){

    it("should send response with failure status if username is not present in request header,query and body",function(){
        let StubData = getStubData();
        StubData.request.body={
            username:null
        };
        StubData.request.headers={
            username:null
        };
        StubData.request.query={
            username:null
        };
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "EMAIL_ADDRESS", value: "Email address not present" } },"data": null } );
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        authControllerPassPort.generateForgotPasswordToken(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should send error if any while getting user by username",function(){
       let StubData = getStubData();
        StubData.request.body={
            username:"username"
        };
        StubData.request.headers={
            username:null
        };
        StubData.request.query={
            username:null
        };
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(new Error("No user with this username"),null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "No user with this username" } },"data": null } );
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        authControllerPassPort.generateForgotPasswordToken(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.responseMock.verify(); 
    });

    it("should send an error if any while updating user after getting user by username",function(){
        let StubData = getStubData();
       let user:IUser=StubData.createAnyUser();
        StubData.request.body={
            username:"username"
        };
        StubData.request.headers={
            username:null
        };
        StubData.request.query={
            username:null
        };
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null,user);
        StubData.userApiMock.expects('updateUser').once().withArgs(user.id,{ credential: user.credential }).yields(new Error("Error in updating user"),null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "UNEXPECTED_ERROR", value: "Error in updating user" } },"data": null } );
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        authControllerPassPort.generateForgotPasswordToken(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.responseMock.verify(); 
    });

    it("should send email and response as success aftre updating user",function(){
        let StubData = getStubData();
       let user:IUser=StubData.createAnyUser();
       let token: String = "someToken123";
        StubData.request.body={
            username:"username"
        };
        StubData.request.headers={
            username:null
        };
        StubData.request.query={
            username:null
        };
        StubData.tokenMock.expects('generateRandomToken').once().returns(token);
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null,user);
        StubData.userApiMock.expects('updateUser').once().withArgs(user.id,{ credential: user.credential }).yields(null,user);
        StubData.emailMock.expects('sendForgetPasswordMail').once().withArgs(user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null },"data": { "token": token } } );
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        authControllerPassPort.generateForgotPasswordToken(StubData.request, StubData.response);
        StubData.tokenMock.verify();
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify(); 
    });

    it("should send error Email address is not registered",function(){
       let StubData = getStubData();
        StubData.request.body={
            username:"username"
        };
        StubData.request.headers={
            username:null
        };
        StubData.request.query={
            username:null
        };
        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null,null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "EMAIL_ADDRESS", value: "Email address is not registered." }},"data": null});
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        authControllerPassPort.generateForgotPasswordToken(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.responseMock.verify(); 
    });
});

describe("verifyForgotPasswordToken", function () {

    it("should return error in response if username is not present in request", function () {
        let StubData = getStubData();
        StubData.request.body = {
            resetPasswordToken: "xxxx"
        }
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "USER_NAME", value: "username not present in request" } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyForgotPasswordToken(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should return error in response if resetPasswordToken is not present in request", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx"
        }
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "RESET_PASSWORD_TOKEN", value: "resetPasswordToken not present in request" } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyForgotPasswordToken(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should return error in response if resetPasswordToken doesnt match with existing one", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx",
            resetPasswordToken: "xxxx"
        }
        let user: IUser = StubData.createAnyUser();
        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = StubData.request.body.resetPasswordToken + "XX";
        StubData.userApiMock.expects("getUserByUserName").once().withArgs(StubData.request.body.username).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "RESET_PASSWORD_TOKEN", value: "resetPasswordToken mismatch" } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyForgotPasswordToken(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.responseMock.verify();

    });

    it("should return error in response if username is not found in system", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx",
            resetPasswordToken: "xxxx"
        }
        StubData.userApiMock.expects("getUserByUserName").once().withArgs(StubData.request.body.username).yields(null, null);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "EMAIL_ADDRESS", value: "Email address is not registered." } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyForgotPasswordToken(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.responseMock.verify();
    });

    it("should return true in response if resetPasswordToken is valid for username", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "xxxx",
            resetPasswordToken: "xxxx"
        }
        let user: IUser = StubData.createAnyUser();
        let credential = <IBasicCredential>user.credential;
        credential.resetPasswordToken = StubData.request.body.resetPasswordToken;
        StubData.userApiMock.expects("getUserByUserName").once().withArgs(StubData.request.body.username).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": user.username });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);
        authControllerPassPort.verifyForgotPasswordToken(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.responseMock.verify();
    });
});

describe("updatePassword", function () {

    it('should update password', function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";

        let credential = <IBasicCredential>user.credential;
        let originalOldPassword = credential.password;
        credential.password = EncryptionUtil.encrypt(originalOldPassword);
        StubData.request.body = {
            username: user.username,
            oldPassword: originalOldPassword,
            newPassword: "Password@%$@$15c"
        }

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);

        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null, user);

        let mockedUpdatedUser = JSON.parse(JSON.stringify(user));
        mockedUpdatedUser.credential = credential;
        StubData.userApiMock.expects('updateUser').once().withArgs(user.id, { credential: credential }).yields(null, mockedUpdatedUser);
        StubData.emailMock.expects('sendPasswordChangeMail').once().withArgs(mockedUpdatedUser);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": mockedUpdatedUser });
        authControllerPassPort.updatePassword(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();
    });

    it('should return error when new password does not meet the standard in update password', function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";


        let credential = <IBasicCredential>user.credential;
        let originalOldPassword = credential.password;
        credential.password = EncryptionUtil.encrypt(originalOldPassword);
        StubData.request.body = {
            username: user.username,
            oldPassword: originalOldPassword,
            newPassword: '####'
        }
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);

        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "NEW_PASSWORD", value: "Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $)." } }, "data": null });
        authControllerPassPort.updatePassword(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();
    });

    it('should return error when old credentials mismatch', function () {
        let StubData = getStubData();
        let user: IUser = StubData.createAnyUser();
        user.id = "123";
        let credential = <IBasicCredential>user.credential;
        StubData.request.body = {
            username: user.username,
            oldPassword: "pass234",
            newPassword: credential.password
        }

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);

        StubData.userApiMock.expects('getUserByUserName').once().withArgs(StubData.request.body.username).yields(null, user);
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "OLD_PASSWORD", value: "Password is incorrect." } }, "data": null });
        authControllerPassPort.updatePassword(StubData.request, StubData.response);
        StubData.userApiMock.verify();
        StubData.emailMock.verify();
        StubData.responseMock.verify();

    });

    it("should return error when old and new password are same", function () {
        let StubData = getStubData();
        StubData.request.body = {
            username: "a@test.com",
            oldPassword: "abc",
            newPassword: "abc"
        }

        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, null);

        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "NEW_PASSWORD", value: "This password is recently used. Please choose a different one." } }, "data": null });
        authControllerPassPort.updatePassword(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

});

describe("validateAccessToken", function () {

   /* it("should use token as search criteria and return true in response if a valid token is found",
        function () {
            let StubData = getStubData();
            let userWithAccessToken: IUser = StubData.createAnyUserWithAccessToken();
            let access:IAccess= StubData.createAnyAccess();
            let token:String = userWithAccessToken.accessToken[0].token.toString();
            StubData.request.headers["token"]= userWithAccessToken.accessToken[0].token.toString();
            access.idToken= new TokenManager().createJwtToken(userWithAccessToken.username, userWithAccessToken.userType, null, null);
            let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
            let result={
                isValidToken:true
            };
            StubData.accessApiMock.expects('getToken').once().withArgs({token:token}).yields(null,access);
            StubData.userApiMock.expects("validateAndUpdateAuthToken").once().yields(null, result);
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data":result });
            authControllerPassPort.validateAccessToken(StubData.request, StubData.response);
            StubData.accessApiMock.verify();
            StubData.userApiMock.verify();
            StubData.responseMock.verify();
        }
    );


    it("should use token as search criteria and return false in response if a valid token is not found",
        function () {
            let StubData = getStubData();
            let userWithAccessToken: IUser = StubData.createAnyUserWithAccessToken();
            let token:String = userWithAccessToken.accessToken[0].token.toString();
            let access:IAccess= StubData.createAnyAccess();
            access.idToken= new TokenManager().createJwtToken(userWithAccessToken.username, userWithAccessToken.userType, null, null);
            StubData.request.headers["token"] = userWithAccessToken.accessToken[0].token.toString();
            let result={
                isValidToken:false
            };
            let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
            StubData.accessApiMock.expects('getToken').once().withArgs({token:token}).yields(null,access);
            StubData.userApiMock.expects("validateAndUpdateAuthToken").once().yields(null, result);
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "TOKEN", value: "INVALID" } }, "data": result });
            authControllerPassPort.validateAccessToken(StubData.request, StubData.response);
            StubData.accessApiMock.verify();
            StubData.userApiMock.verify();
            StubData.responseMock.verify();
        }
    );*/

    it("should return error in response if token is not present",function(){
        let StubData = getStubData();
        let userWithAccessToken: IUser = StubData.createAnyUserWithAccessToken();
        StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "TOKEN", value: "token is not present in header." } }, "data": null });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
        authControllerPassPort.validateAccessToken(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

   /* it("should send error if any while getting token",function () {
            let StubData = getStubData();
            let userWithAccessToken: IUser = StubData.createAnyUserWithAccessToken();
            let token:String = userWithAccessToken.accessToken[0].token.toString();
            StubData.request.headers["token"] = userWithAccessToken.accessToken[0].token.toString();
            StubData.accessApiMock.expects('getToken').once().withArgs({token: token}).yields(null,null);
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "failure", "message": { key: "TOKEN", value: "INVALID" } }, "data": {"isValidToken": false} });
            let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
            authControllerPassPort.validateAccessToken(StubData.request, StubData.response);
            StubData.accessApiMock.verify();
            StubData.responseMock.verify();
        }
    );

    it("should use token as search criteria and return false in response if a valid token is found when user type is ip",
        function () {
            let StubData = getStubData();
            let userWithAccessToken: IUser = StubData.createAnyUserWithAccessToken();
            userWithAccessToken.userType='ip';
            StubData.request.headers={
                clientip:<string>userWithAccessToken.username
            }
            let token:String = userWithAccessToken.accessToken[0].token.toString();
            let access:IAccess= StubData.createAnyAccess();
            access.idToken= new TokenManager().createJwtToken(userWithAccessToken.username, userWithAccessToken.userType, null, null);
            StubData.request.headers["token"] = userWithAccessToken.accessToken[0].token.toString();
            let result={
                isValidToken:true
            };
            let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, null, null, null, StubData.accessApi);
            StubData.accessApiMock.expects('getToken').once().withArgs({token:token}).yields(null,access);
            StubData.userApiMock.expects("validateAndUpdateAuthToken").once().yields(null, result);
            StubData.responseMock.expects('send').once().withArgs({ "metadata": { "status": "success", "message": null }, "data": result });
            authControllerPassPort.validateAccessToken(StubData.request, StubData.response);
            StubData.accessApiMock.verify();
            StubData.userApiMock.verify();
            StubData.responseMock.verify();
        }
    );*/
});

/*describe("getFacebookLogin",function(){
    it("should authenticate using facebook strategy",function(){
       let StubData =getStubData();
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(null, null, null, null, null, passport, null, null, null, null);
       authControllerPassPort.getFacebookLogin(StubData.request,StubData.response);
       sinon.assert.calledOnce(StubData.stubPassport);
    });
});*/

describe("loginOrRegisterUserByFacebook", function () {

    it("should authenticate using facebook strategy and send error if user is null", function () {
        let StubData = getStubData();
        let err= new Error("No User");
        StubData.stubPassport.yields(err,null);
        StubData.responseMock.expects('send').once().withArgs({ error: err, user: null })
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);;
        authControllerPassPort.loginOrRegisterUserByFacebook(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should redirect to authorize page if isAuthorizationFlow is true in request session after creating user",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        (<any>StubData.request).session={
             isAuthorizationFlow:true  
        }
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('redirect').once().withArgs("/user/auth/authorize?step2=true");
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByFacebook(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    })

    it("should create access token if user is not validated",function(){
        let StubData = getStubData();
        let user=StubData.createAnyUser();
        user.isValidated=true;
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByFacebook(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.accessTokenUtilMock.verify();
        StubData.responseMock.verify();
    });
    
    it("should send error and user when isAuthorizationFlow is false and user is not validated",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').once().withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByFacebook(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    });
});

/*describe("getTwitterLogin",function(){

    it("should authenticate using twitter strategy",function(){
       let StubData =getStubData();
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(null, null, null, null, null, passport, null, null, null, null);
       authControllerPassPort.getTwitterLogin(StubData.request,StubData.response);
       sinon.assert.calledOnce(StubData.stubPassport).yields({ scope: ['email', "user_birthday", "user_hometown", "user_work_history"] });
    });
});*/

describe("loginOrRegisterUserByTwitter", function () {

    it("should authenticate using twitter strategy and send error if user is null", function () {
        let StubData = getStubData();
        let err= new Error("No User");
        StubData.stubPassport.yields(err,null);
        StubData.responseMock.expects('send').once().withArgs({ error: err, user: null })
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);;
        authControllerPassPort.loginOrRegisterUserByTwitter(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should redirect to authorize page if isAuthorizationFlow is true in request session after creating user",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        (<any>StubData.request).session={
             isAuthorizationFlow:true  
        }
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('redirect').once().withArgs("/user/auth/authorize?step2=true");
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByTwitter(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    })

    it("should create access token if user is not validated",function(){
        let StubData = getStubData();
        let user=StubData.createAnyUser();
        user.isValidated=true;
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByTwitter(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.accessTokenUtilMock.verify();
        StubData.responseMock.verify();
    });
    
    it("should send error and user when isAuthorizationFlow is false and user is not validated",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').once().withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByTwitter(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    });
});

/*describe("getLinkedinLogin",function(){

    it("should authenticate using linkedin strategy",function(){
       let StubData =getStubData();
       let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(null, null, null, null, null, passport, null, null, null, null);
       authControllerPassPort.getLinkedinLogin(StubData.request,StubData.response);
       sinon.assert.calledOnce(StubData.stubPassport);
    });
});*/

describe("loginOrRegisterUserByLinkedin", function () {

    it("should authenticate using linkedin strategy and send error if user is null", function () {
        let StubData = getStubData();
        let err= new Error("No User");
        StubData.stubPassport.yields(err,null);
        StubData.responseMock.expects('send').once().withArgs({ error: err, user: null })
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);;
        authControllerPassPort.loginOrRegisterUserByLinkedin(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should redirect to authorize page if isAuthorizationFlow is true in request session after creating user",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        (<any>StubData.request).session={
             isAuthorizationFlow:true  
        }
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('redirect').once().withArgs("/user/auth/authorize?step2=true");
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByLinkedin(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    })

    it("should create access token if user is not validated",function(){
        let StubData = getStubData();
        let user=StubData.createAnyUser();
        user.isValidated=true;
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByLinkedin(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.accessTokenUtilMock.verify();
        StubData.responseMock.verify();
    });
    
    it("should send error and user when isAuthorizationFlow is false and user is not validated",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').once().withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByLinkedin(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    });
});

describe("loginOrRegisterUserByGoogle", function () {

    it("should authenticate using google strategy and send error if user is null", function () {
        let StubData = getStubData();
        let err= new Error("No User");
        StubData.stubPassport.yields(err,null);
        StubData.responseMock.expects('send').once().withArgs({ error: err, user: null })
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);;
        authControllerPassPort.loginOrRegisterUserByGoogle(StubData.request, StubData.response);
        StubData.responseMock.verify();
    });

    it("should redirect to authorize page if isAuthorizationFlow is true in request session after creating user",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        (<any>StubData.request).session={
             isAuthorizationFlow:true  
        }
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('redirect').once().withArgs("/user/auth/authorize?step2=true");
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByGoogle(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    })

    it("should create access token if user is not validated",function(){
        let StubData = getStubData();
        let user=StubData.createAnyUser();
        user.isValidated=true;
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.accessTokenUtilMock.expects('createAccessToken').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByGoogle(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.accessTokenUtilMock.verify();
        StubData.responseMock.verify();
    });
    
    it("should send error and user when isAuthorizationFlow is false and user is not validated",function(){
        let StubData = getStubData();
        let user:IUser= StubData.createAnyUser();
        StubData.stubPassport.yields(null,user);
        StubData.socialStrategyUtilMock.expects('registerOrLoginSocialUser').once().withArgs(StubData.request,user).yields(null,user);
        StubData.responseMock.expects('send').once().withArgs({ error: null, user: user });
        let authControllerPassPort: AuthControllerPassport = new AuthControllerPassport(StubData.userApi, StubData.clientApi, StubData.tokenApi, StubData.emailService, StubData.passportService, passport, StubData.socialStrategyUtil, null, StubData.accessTokenUtil, null);
        authControllerPassPort.loginOrRegisterUserByGoogle(StubData.request,StubData.response);
        StubData.socialStrategyUtilMock.verify();
        StubData.responseMock.verify();
    });
});
});

