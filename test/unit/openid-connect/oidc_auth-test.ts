import querystring = require('querystring');
import cryptoUtil = require('crypto');
import url = require('url');
import jwt = require('jwt-simple');
import util = require("util");
import MongoUserDao = require("../../../src/model/mongo/dao/user-dao-mongo");
import MongoClientDao = require("../../../src/model/mongo/dao/client-dao-mongo");
import MongoAccessDao = require("../../../src/model/mongo/dao/access-dao-mongo");
import MongoAuthDao = require("../../../src/model/mongo/dao/auth-dao-mongo");
import MongoConsentDao = require("../../../src/model/mongo/dao/consent-dao-mongo");
import MongoRefreshDao = require("../../../src/model/mongo/dao/refresh-dao-mongo");
import Util =require("../util/test-util");
//import base64url = require('base64url');
import  {expect} from "chai";
import {Request, Response} from "express";
let sinon = require('sinon');
let ApplicationConfig = require("../../../src/config/application-config");
let DaoFactory = require('../../../src/model/dao/dao-factory');
let MockExpressRequest = require('mock-express-request');
let MockExpressResponse = require('mock-express-response');
let request: Request = new MockExpressRequest();
let response: Response = new MockExpressResponse();
let responseMock = sinon.mock(response);
let options: any = {
	// login_url: '/user/auth/authorizatonLogin',
	consent_url: ApplicationConfig.REDIRECT_CONFIG.consent_url,
	scopes: {
        foo: 'Access to foo special resource',
        bar: 'Access to bar special resource',
        mail: 'Access to foo special resource',
        username: 'Access to bar special resource',
        friends: 'Access to foo special resource',
        dob: 'Access to bar special resource'
    },
	models: { user: { attributes: { sub: function () { return this.email; } } } }
};
let oidc = require('../../../src/openid-connect/oidc').oidc(options, MongoClientDao, MongoUserDao, MongoAccessDao, MongoConsentDao, MongoRefreshDao, MongoAuthDao);
let oidcAuth = require('../../../src/openid-connect/oidc_auth').oidc(options);

function getStubData() {
    let util = new Util();
    let consentDao=util.createConsentDao();
    let consentDaoMock=sinon.mock(consentDao);
    let request: Request = new MockExpressRequest();
    let response: Response = new MockExpressResponse();
    let responseMock = sinon.mock(response);
    let next = function(){
        console.log("next called");
    }
    let spyNext=sinon.spy(next);
    return {
        request: request,
        response: response,
        responseMock: responseMock,
        next:next,
        spyNext:spyNext,
        consentDao:consentDao,
        consentDaoMock:consentDaoMock
    }
}



describe("OIDC Auth", function () {

    it("should call next if user is present in session",function(done :any){
        let StubData=getStubData();
        let ret=oidcAuth.auth();
        let a=ret[1];
        (<any>StubData.request).session={
               user:"user",
        }
        let spyNext=sinon.spy(StubData,'next');
        a(StubData.request,StubData.response,StubData.next);
        expect(spyNext.called).to.be.true;
        done();
    })
    it("should redirect to specified URL if user accepts the consent", function (done :any){
        let StubData=getStubData();
        let ret=oidcAuth.consent();
        var a=ret[0];
        StubData.request.body={
            accept:true,
            return_url:"google.com"
        },
        (<any>StubData.request).session={
               scopes:options.scopes,
               user:"user",
               req_client_id:1,
               clients:[0,1,2]
        }
        let daoFactoryMock = sinon.mock(DaoFactory);
        daoFactoryMock.expects('getConsentDao').twice().returns(StubData.consentDao);
        StubData.consentDaoMock.expects('removeConsent').once().yields(null, null);
        StubData.consentDaoMock.expects('createConsent').once().yields(null, null);
        StubData.responseMock.expects('redirect').once().withArgs(ApplicationConfig.REDIRECT_CONFIG.this_api_base_url +"/user/auth"+ StubData.request.body.return_url);
        a(StubData.request, StubData.response, StubData.next);
        StubData.consentDaoMock.verify();
        StubData.responseMock.verify();
        done();
    })

    it("should ", function (done :any){
        let StubData=getStubData();
        let ret=oidcAuth.consent();
        var a=ret[0];
        StubData.responseMock.expects('send').once().withArgs(400,'access_denied: Resource Owner denied Access.')
        a(StubData.request,StubData.response,StubData.next);
        StubData.responseMock.verify();
        done();
    })
})



