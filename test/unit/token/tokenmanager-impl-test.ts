
var expect    = require("chai").expect;

import ItokenManager = require('../../../src/token/tokenmanager');
import TokenManager = require('../../../src/token/tokenmanager-impl');
import jwt = require('jwt-simple');

function getStubData(){
        let secret = '14mS3cr3tK3y4ndH4sh3r@#$%$#@<<>>>>><<<<FISH';
        let username: String = "anyUserName";
        let userType : String = "author"
        let createdOn : Number = 22;
        let client : String = "anyClient";
        let token = jwt.encode({"username":username, "userType":userType,  "createdOn": createdOn, "client": client}, secret);
        return{
            secret : secret,
            username : username,
            userType : userType,
            createdOn : createdOn,
            client: client,
            token : token
        }
}

describe("token", function(){
    it("generateRandomToken", function(){
        let tokenManager:ItokenManager = new TokenManager();
        expect(tokenManager.generateRandomToken()).to.be.not.null;
        expect(tokenManager.generateRandomToken()).to.be.a('String');
    });

    it("generateRandomToken", function(){
        let tokenManager:ItokenManager = new TokenManager();
        let StubData = getStubData();
        expect(tokenManager.createJwtToken(StubData.username, StubData.userType,StubData.createdOn, StubData.client)).to.equal(StubData.token);
        expect(tokenManager.createJwtToken(StubData.username, StubData.userType,StubData.createdOn, StubData.client)).to.be.not.null;
        expect(tokenManager.createJwtToken(StubData.username, StubData.userType,StubData.createdOn, StubData.client)).to.be.a('String');
    });

    it("authenticateJwtToken", function(){
        let tokenManager:ItokenManager = new TokenManager();
        let StubData = getStubData();
        let decoded :any = null;
        decoded = jwt.decode(StubData.token, StubData.secret);
        expect(tokenManager.authenticateJwtToken(StubData.username, StubData.token)).to.equal.true;
        expect(tokenManager.authenticateJwtToken("username", StubData.token)).to.equal.false;
    })
})