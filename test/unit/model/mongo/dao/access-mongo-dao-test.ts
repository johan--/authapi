var expect = require("chai").expect;
import AccessDao = require("../../../../../src/model/mongo/dao/access-dao-mongo");
import mongoose = require("mongoose");
import accessSchema = require("../../../../../src/model/mongo/schema/access-schema");
import IAccess = require("../../../../../src/model/entity/access");
import AccessToken = require("../../../../../src/model/entity/access-token");
import ApplicationConfig = require("../../../../../src/config/application-config");
var dbConnection = require("./dbConnection");
dbConnection.on('error', console.error.bind(console, 'connection error:'));

dbConnection.on('connected', function () {
  console.log('Mongoose default connection open ');
});

let accessModel = mongoose.model('Access', accessSchema);

function createMultipleAccesses(accessesToCreate: Array<IAccess>,
  createdAccesses: Array<IAccess>,
  callback: (err: any) => void): void {

  let accessToCreate: IAccess = accessesToCreate[0];
  accessModel.create(accessToCreate, function (err: any, createdAccess: IAccess) {
    if (err) {
      throw err
    }
    else if (createdAccess) {
      if (accessesToCreate.length > 1) {
        accessesToCreate.shift();
        createdAccesses.push(createdAccess);
        createMultipleAccesses(accessesToCreate, createdAccesses, callback);
      } else if (accessesToCreate.length == 1) {
        createdAccesses.push(createdAccess);
        callback(null);
      }
    }

  });
}

function createAnyAccess() {
  var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
  if (uniqueNumber < 10)
    uniqueNumber = uniqueNumber + 10;
  return {
    type: "type" + uniqueNumber,
    token: "token" + uniqueNumber,
    idToken: "idToken" + uniqueNumber,
    expiresIn: uniqueNumber,
    expiresOn: uniqueNumber + 1,
    scope: ["scope1", "scope2"],
    client: "itisclient" + uniqueNumber,
    user: "userinaces" + uniqueNumber,
    auth: "authinaces" + uniqueNumber
  }
}


describe("AccessCRUD", function () {

  beforeEach(function () {
    console.log("removing all users");
    accessModel.remove({}, function (error: any) {
      console.log("after removing all users : " + error);
    });

  });
  it("creates access and insert to accessModel", function (done :any){
    this.timeout(14000);
    let anyAccess: IAccess = createAnyAccess();
    new AccessDao(dbConnection).insertToAccess(anyAccess, function (error: any, newAccess: IAccess) {
      if (error) throw error;
      expect(newAccess.token).to.be.equal(anyAccess.token);
      expect(newAccess.type).to.be.equal(anyAccess.type);
      done();
    })
  })

  /*it("should update the access by changing its expiry time", function (done :any){
    let anyAccess1: IAccess = createAnyAccess();
    let anyAccess2: IAccess = createAnyAccess();
    let updatedData: any = 100;
    let accessesToCreate: Array<IAccess> = [anyAccess1, anyAccess2];
    let createdAccess: Array<IAccess> = [];

    createMultipleAccesses(accessesToCreate, createdAccess, function (err: any) {
      expect(createdAccess.length).to.equal(2);
      let access1: IAccess = createdAccess[0];
      console.log(JSON.stringify(access1));
      new AccessDao(dbConnection).findAccess({ expiresOn: access1.expiresOn }, function (err: Error, existingAccess: Array<IAccess>) {
        console.log("existing access--" + existingAccess);
        console.log(this);
        new AccessDao(dbConnection).updateAccess(access1, (access1.expiresOn) + updatedData, function (error: any, updatedAccess: IAccess) {
          if (error) throw error;
          expect(updatedAccess.expiresOn).not.to.be.equal(access1.expiresOn);
          expect(updatedAccess.expiresOn).to.be.equal(100);
        });
      });
    });
  });*/

  it("should find access on given criteria", function (done :any){
    this.timeout(14000);
    let anyAccess1: IAccess = createAnyAccess();
    let anyAccess2: IAccess = createAnyAccess();
    let accessesToCreate: Array<IAccess> = [anyAccess1, anyAccess2];
    let createdAccess: Array<IAccess> = [];
    createMultipleAccesses(accessesToCreate, createdAccess, function (err: any) {
      console.log('createMultipleAccesseserr', err)
      expect(createdAccess.length).to.equal(2);
      let access1: IAccess = createdAccess[0];
      let criteria = { idToken: access1.idToken };
      new AccessDao(dbConnection).findAccess(criteria, function (error: any, accessList: Array<IAccess>) {
        console.log('AccessDaoerror', error)
        console.log(accessList)
        expect(accessList.length).to.be.above(0);
        done();
      });
    });
  });

  it("should remove access on given criteria", function (done :any){
    let anyAccess1: IAccess = createAnyAccess();
    let anyAccess2: IAccess = createAnyAccess();
    let accessesToCreate: Array<IAccess> = [anyAccess1, anyAccess2];
    let createdAccess: Array<IAccess> = [];
    createMultipleAccesses(accessesToCreate, createdAccess, function (err: any) {
      expect(createdAccess.length).to.equal(2);
      let access1: IAccess = createdAccess[0];
      let criteria = { idToken: access1.idToken };
      new AccessDao(dbConnection).removeAccess(criteria, function (error: any) {
        if (error) throw error
        accessModel.count({}, function (err: any, count: number) {
          expect(count).to.be.equal(1);
          done();
        })
      });
    });
  });

  it("should get the access by its token", function (done :any){
    let anyAccess1: IAccess = createAnyAccess();
    let anyAccess2: IAccess = createAnyAccess();
    let accessesToCreate: Array<IAccess> = [anyAccess1, anyAccess2];
    let createdAccess: Array<IAccess> = [];
    createMultipleAccesses(accessesToCreate, createdAccess, function (err: any) {
      expect(createdAccess.length).to.equal(2);
      let access1: IAccess = createdAccess[0];
      let criteria = { token: access1.token };
      new AccessDao(dbConnection).getToken(criteria, function (error: any, access: IAccess) {
        expect(access.idToken).to.be.equal(access1.idToken);
        done();
      });
    });
  })

  //when whould it give error?
  it("should return error if criteria is not invalid", function (done :any){
    let anyAccess1: IAccess = createAnyAccess();
    let anyAccess2: IAccess = createAnyAccess();
    let accessesToCreate: Array<IAccess> = [anyAccess1, anyAccess2];
    let createdAccess: Array<IAccess> = [];
    createMultipleAccesses(accessesToCreate, createdAccess, function (err: any) {
      expect(createdAccess.length).to.equal(2);
      let access1: IAccess = createdAccess[0];
      let criteria = { token123: "abcd" };
      new AccessDao(dbConnection).getToken(criteria, function (error: any, access: IAccess) {
        expect(access).to.be.null;
        done();
      });
    });
  })
});
