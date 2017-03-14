var expect = require("chai").expect;
import AuthDao = require("../../../../../src/model/mongo/dao/auth-dao-mongo");
import mongoose = require("mongoose");
import authSchema = require("../../../../../src/model/mongo/schema/auth-schema");
import IAuth = require("../../../../../src/model/entity/authcode");
import ApplicationConfig = require("../../../../../src/config/application-config");
var dbConnection = require("./dbConnection");

dbConnection.on('connected', function () {
  console.log('Mongoose default connection open ');
});

let authModel = mongoose.model("Auth", authSchema);

function createMultipleAuths(authsToCreate: Array<IAuth>,
  createdAuths: Array<IAuth>,
  callback: (err: any) => void): void {

  let authToCreate: IAuth = authsToCreate[0];
  authModel.create(authToCreate, function (err: any, createdAuth: IAuth) {
    if (err) {
      throw err
    }
    else if (createdAuth) {
      if (authsToCreate.length > 1) {
        authsToCreate.shift();
        createdAuths.push(createdAuth);
        createMultipleAuths(authsToCreate, createdAuths, callback);
      } else if (authsToCreate.length == 1) {
        createdAuths.push(createdAuth);
        callback(null);
      }
    }

  });
}

function createAnyAuth() {
  var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
  if (uniqueNumber < 10)
    uniqueNumber = uniqueNumber + 10;
  return {
    user: "userinaces" + uniqueNumber,
    client: "itisclient" + uniqueNumber,
    scope: ["scope1", "scope2"],
    code: "itiscode" + uniqueNumber,
    redirectUri: "redirectUri@" + uniqueNumber,
    responseType: "resType" + uniqueNumber,
    status: "status" + uniqueNumber,
    sub: "anysub" + uniqueNumber,
  }
}



describe("AuthCRUD", function () {

  beforeEach(function () {
    console.log("removing all users");
    authModel.remove({}, function (error: any) {
      console.log("after removing all users : " + error);
    });

  });

  it("should create authcode successfully", function (done :any){
    this.timeout(14000);
    let anyAuth: IAuth = createAnyAuth();
    new AuthDao(dbConnection).createAuthCode(anyAuth, function (error: any, newAuth: IAuth) {
      expect(newAuth.responseType).to.be.equal(anyAuth.responseType);
      expect(newAuth.code).to.be.equal(anyAuth.code);
      done();
    });
  });

  it("should return error if any while creating authcode", function (done :any){
    let anyAuth: IAuth = createAnyAuth();
    anyAuth.code = null;
    new AuthDao(dbConnection).createAuthCode(anyAuth, function (error: any, newAuth: IAuth) {
      expect(error).not.to.be.null;
      expect(error.message).to.be.equal("Auth validation failed")
      expect(newAuth).to.be.null;
      done();
    });
  });

  it("should return authcode if there exist any with the given criteria", function (done :any){
    let anyAuth1: IAuth = createAnyAuth();
    let anyAuth2: IAuth = createAnyAuth();
    let authsToCreate: Array<IAuth> = [anyAuth1, anyAuth2];
    let createdAuths: Array<IAuth> = [];
    createMultipleAuths(authsToCreate, createdAuths, function (err: any) {
      let auth1: IAuth = createdAuths[0];
      expect(createdAuths.length).to.be.equal(2);
      new AuthDao(dbConnection).findAuthCode({ user: auth1.user }, function (err: any, auths: Array<IAuth>) {
        if (err) throw err;
        expect(auths[0].code).to.equal(auth1.code);
        expect(auths[0].responseType).to.equal(auth1.responseType);
        done();
      });
    });
  });

  it("should remove the authcode if there exist any with the given criteria", function (done :any){
    let anyAuth1: IAuth = createAnyAuth();
    let anyAuth2: IAuth = createAnyAuth();
    let authsToCreate: Array<IAuth> = [anyAuth1, anyAuth2];
    let createdAuths: Array<IAuth> = [];
    createMultipleAuths(authsToCreate, createdAuths, function (err: any) {
      let auth1: IAuth = createdAuths[0];
      expect(createdAuths.length).to.be.equal(2);
      new AuthDao(dbConnection).removeAuthCode({ user: auth1.user }, function (err: any) {
        authModel.count({}, function (err: any, count: number) {
          expect(count).to.be.equal(1);
          done();
        })
      });
    });
  })

  /*it("should return the authcode on basis on code", function (done :any){
    let anyAuth1: IAuth = createAnyAuth();
    let anyAuth2: IAuth = createAnyAuth();
    let authsToCreate: Array<IAuth> = [anyAuth1, anyAuth2];
    let createdAuths: Array<IAuth> = [];
    createMultipleAuths(authsToCreate, createdAuths, function (err: any) {
      let auth1: IAuth = createdAuths[0];
      expect(createdAuths.length).to.be.equal(2);
      new AuthDao(dbConnection).getAuthBasedOnCode({ code: auth1.code }, function (err: any,newAuth:IAuth) {
        console.log(err+"============");
       if(err) throw err;
                expect(newAuth.code).to.equal(auth1.code);
                expect(newAuth.responseType).to.equal(auth1.responseType);
                done()
      });
    });
  })*/
});
