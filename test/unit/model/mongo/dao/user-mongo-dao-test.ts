var expect = require("chai").expect;
import UserDao = require("../../../../../src/model/mongo/dao/user-dao-mongo");
import mongoose = require("mongoose");
import userSchema = require("../../../../../src/model/mongo/schema/user-schema");
import IUser = require("../../../../../src/model/entity/user");
import AccessToken = require("../../../../../src/model/entity/access-token");
import Consent = require("../../../../../src/model/entity/consent");
import Client = require("../../../../../src/model/entity/client");
import IBasicCredential = require("../../../../../src/model/entity/basic-credential");
import ApplicationConfig = require("../../../../../src/config/application-config");
import Address = require("../../../../../src/model/entity/address");
import Helper = require("../../../../../src/util/helper");
var dbConnection = require("./dbConnection");

dbConnection.on('connected', function () {
  console.log('Mongoose default connection open ');
});

let userModel = mongoose.model("User", userSchema);

function createAnyUserInDb(callback: (err: any, user: IUser) => void): void {
  let anyUser: IUser = createAnyUser();
  userModel.create(anyUser, function (err: any, createdUser: IUser) {
    callback(err, createdUser);
  });

}

function createMultipleUsers(usersToCreate: Array<IUser>,
  createdUsers: Array<IUser>,
  callback: (err: any) => void): void {

  let userToCreate: IUser = usersToCreate[0];
  userModel.create(userToCreate, function (err: any, createdUser: IUser) {
    if (err) {
      throw err
    }
    else if (createdUser) {
      if (usersToCreate.length > 1) {
        usersToCreate.shift();
        createdUsers.push(createdUser);
        createMultipleUsers(usersToCreate, createdUsers, callback);
      } else if (usersToCreate.length == 1) {
        createdUsers.push(createdUser);
        callback(null);
      }
    }

  });
}

function createAnyUser() {
  var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
  console.log("uniqueNumber-" + uniqueNumber);
  return {
    id: String("userid" + uniqueNumber),
    userType: "customer",
    username: "username" + uniqueNumber,
    firstName: "fname" + uniqueNumber,
    lastName: "lname" + uniqueNumber,
    organization: "org" + uniqueNumber,
    jobTitle: "job" + uniqueNumber,
    dob: new Date(),
    language: "lan" + uniqueNumber,
    mobilePhone: "" + uniqueNumber,
    homePhone: "" + uniqueNumber,
    businessPhone: "" + uniqueNumber,
    fax: "" + uniqueNumber,
    email: "username" + uniqueNumber,
    isValidated: false,
    registrationVerificationToken: String(null),
    registrationVerificationTokenExpiry: new Date().getTime() + 1000 * 60,
    address: {
      addressLine1: "addr1" + uniqueNumber,
      addressLine2: "addr2" + uniqueNumber,
      city: "city" + uniqueNumber,
      state: "state" + uniqueNumber,
      country: "country" + uniqueNumber,
      zipCode: "" + uniqueNumber,
    },
    credential: {
      username: "username" + uniqueNumber,
      password: "123" + uniqueNumber
    },
    createdOn: uniqueNumber,
    accessToken: Array<AccessToken>(),
    consents: Array<Consent>(),
    clients: Array<Client>()
  };
}

function createAnyUserWithAccessToken() {
  var uniqueAccessNumber = Math.floor(Math.random() * (100 - 0) + 0);
  var user = createAnyUser();
  user.accessToken = [
    {
      token: 'token' + uniqueAccessNumber,
      expiry: Helper.getNewExpirationTime(),
      username: user.username,
      clientId: "client" + uniqueAccessNumber,
      type: "user-access-token",
      idToken: "",
      scope: ""
    }
  ]
  return user;


}



describe('UserCRUD', function () {

  beforeEach(function () {
    console.log("removing all users");
    userModel.remove({}, function (error: any) {
      console.log("after removing all users : " + error);
    });

  });
  it('creates user successfully with address and credentials', function (done :any){
    this.timeout(10000);
    let anyUser: IUser = createAnyUser();
    new UserDao(dbConnection).createUser(
      anyUser
      , function (error: any, newuser: IUser) {
        if (error) throw error;
        expect(newuser.id).to.have.length.above(0);
        expect(newuser.username).to.equal(anyUser.username);
        console.log(newuser.id);
        userModel.findById(newuser.id.toString(), function (error: any, user: IUser) {
          expect(user.id).to.have.length.above(0);
          expect(user.username).to.equal(newuser.username);
          let credential: IBasicCredential = <IBasicCredential>user.credential;
          expect(credential.password).to.equal((<IBasicCredential>newuser.credential).password);
          done();
        });
      });
  });

  it('gets user by id', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      expect(createdUsers.length).to.equal(2);
      let user1: IUser = createdUsers[0];
      new UserDao(dbConnection).getUserByUserId(user1.id, function (err: any, userById1: IUser) {
        console.log("userById1 id : " + userById1.id + " :: " + userById1);
        expect(userById1.id).to.equal(user1.id);
        expect(userById1.username).to.equal(user1.username);
        done();

      });

    });
  });

  it('gets user by username', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      expect(createdUsers.length).to.equal(2);
      let user1: IUser = createdUsers[0];
      new UserDao(dbConnection).getUserByUserName(user1.username, function (err: any, userByUserName: IUser) {
        console.log("userById1 id : " + userByUserName.id + " :: " + userByUserName);
        expect(userByUserName.id).to.equal(user1.id);
        expect(userByUserName.username).to.equal(user1.username);
        done();
      });

    });
  });

  it('should return empty when no users present', function (done :any){
    new UserDao(dbConnection).searchUsers({}, function (error: any, userList: any) {
      if (error) throw error;
      expect(userList.length).to.equal(0);
      done();
    });
  });

  it('updates user details', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      expect(createdUsers.length).to.equal(2);
      let user1: IUser = createdUsers[0];
      new UserDao(dbConnection).updateUser(user1.id, { firstName: "someFirstName" },
        function (err: any, updatedUser: IUser) {
          expect(updatedUser.id).to.equal(user1.id);
          expect(updatedUser.firstName).to.equal("someFirstName");
          userModel.findById(updatedUser.id.toString(), function (err: any, user: IUser) {
            expect(user.id).to.equal(updatedUser.id);
            done();
          });
        });
    });
  });

  it('updates credential details', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user1: IUser = createdUsers[0];
      let credentialToUpdate: IBasicCredential = <IBasicCredential>user1.credential;
      credentialToUpdate.password = "xxx";
      new UserDao(dbConnection).updateUser(user1.id, { credential: credentialToUpdate },
        function (err: any, updatedUser: IUser) {
          expect(updatedUser.id).to.equal(user1.id);
          let updatedCredential: IBasicCredential = <IBasicCredential>updatedUser.credential;
          expect(updatedCredential.password).to.equal("xxx");
          userModel.findById(updatedUser.id.toString(), function (err: any, user: IUser) {
            expect(user.id).to.equal(updatedUser.id);
            let userCredential: IBasicCredential = <IBasicCredential>user.credential;
            expect(userCredential.password).to.equal(updatedCredential.password);
            done();
          })

        });
    });
  });

  it('should search by userType', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    anyUser2.userType = "Employee";
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      expect(createdUsers.length).to.equal(2);
      expect(createdUsers[0].userType).to.equal("customer");
      expect(createdUsers[1].userType).to.equal("Employee");
      new UserDao(dbConnection).searchUsers({ "userType": "customer" }, function (error: any, userList: any) {
        if (error) throw error;
        expect(userList.length).to.equal(1);
        expect(userList[0].userType).to.equal("customer");
        done();
      });
    });
  });


  it('should return error on updating user with id which does not exist', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user1: IUser = createdUsers[0];
      new UserDao(dbConnection).removeUser(user1.id, function (error: any, removedUser: IUser) {
        if (error) throw error;
        expect(user1.id).to.equal(removedUser.id);
        expect(user1.username).to.equal(removedUser.username);
        new UserDao(dbConnection).updateUser(removedUser.id, { firstName: "someFirstName" },
          function (err: any, updatedUser: IUser) {
            expect(err).to.exist.and.be.instanceof(Error).and.have.property('message', 'No user with this id');
            expect(updatedUser).to.be.null;
            done();
          });
      });
    });
  });

  it('should remove user ', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      expect(createdUsers.length).to.equal(2);
      let user1: IUser = createdUsers[0];
      new UserDao(dbConnection).removeUser(user1.id, function (error: any, removedUser: IUser) {
        if (error) throw error;
        expect(user1.id).to.equal(removedUser.id);
        expect(user1.username).to.equal(removedUser.username);
        userModel.findById(removedUser.id.toString(), function (error: any, user: IUser) {
          if (error) throw error;
          expect(user).to.be.null;
          done();
        });
      });
    });
  });

  it('should updates address details', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      expect(createdUsers.length).to.equal(2);
      let user1: IUser = createdUsers[0];
      let addressToUpdate: Address = user1.address;
      addressToUpdate.country = "Kuwait";
      new UserDao(dbConnection).updateUser(user1.id, { address: addressToUpdate },
        function (err: any, updatedUser: IUser) {
          expect(updatedUser.id).to.equal(user1.id);
          let updatedAddress: Address = updatedUser.address;
          expect(updatedAddress.country).to.equal("Kuwait");
          userModel.find({ 'address.country': 'Kuwait' }, function (err: any, userList: Array<IUser>) {
            expect(userList.length).to.be.above(0);
            done();
          });

        });
    });
  });

  it('should search based on credential', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user2: IUser = createdUsers[1];
      expect(user2.id).to.have.length.above(0);
      expect(user2.username).to.equal(anyUser2.username);
      let User1Credential: IBasicCredential = <IBasicCredential>anyUser1.credential;
      let User2Credential: IBasicCredential = <IBasicCredential>anyUser2.credential;
      expect(User1Credential.username).to.not.equal(User2Credential.username);
      new UserDao(dbConnection).searchUsers({ "credential.username": User2Credential.username }, function (error: any, userList: any) {
        if (error) throw error;
        expect(userList).to.have.lengthOf(1);
        done();
      });
    });
  });

  it('should search based on organization', function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    anyUser2.organization = anyUser1.organization;
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user1: IUser = createdUsers[1];
      let user2: IUser = createdUsers[1];
      expect(user2.id).to.have.length.above(0);
      expect(user2.organization).to.equal(anyUser2.organization);
      new UserDao(dbConnection).searchUsers({ "organization": user1.organization }, function (error: any, userList: any) {
        if (error) throw error;
        expect(userList).to.have.lengthOf(2);
        done();
      });
    });
  });

  it("should give the list of only one user", function (done :any){
    let anyUser1: IUser = createAnyUser();
    let anyUser2: IUser = createAnyUser();
    anyUser2.organization = anyUser1.organization;
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user1: IUser = createdUsers[1];
      let user2: IUser = createdUsers[1];
      expect(user2.id).to.have.length.above(0);
      expect(user2.organization).to.equal(anyUser2.organization);
      new UserDao(dbConnection).listUser({ "organization": user1.organization }, function (error: any, users: Array<IUser>) {
        if (error) throw error;
        expect(users.length).to.equal(1);
        done();
      });
    });
  });

  //access token
  /*it("shoould return user if it has access token",function(done :any){

    let anyUser1: IUser = createAnyUserWithAccessToken();
    let anyUser2: IUser = createAnyUserWithAccessToken();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user: IUser = createdUsers[0];
      let acessTokens: Array<AccessToken> = user.accessToken;
      new UserDao(dbConnection).getUserByAuthToken(acessTokens[0].token,function(error: Error, userByToken: IUser){
        if(error) throw error;
        expect(userByToken.id).to.equal(user.id);
      });
    });*/
});

describe("Token Validation", function () {

  beforeEach(function () {
    console.log("removing all users");
    userModel.remove({}, function (error: any) {
      console.log("after removing all users : " + error);
    });

  });

  it('should return true when only one user has the unique acess token', function (done :any){

    let anyUser1: IUser = createAnyUserWithAccessToken();
    let anyUser2: IUser = createAnyUserWithAccessToken();
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    console.log("user to create", usersToCreate[0].accessToken);
    console.log("user to create", usersToCreate[1].accessToken);
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user: IUser = createdUsers[0];
      let acessTokens: Array<AccessToken> = user.accessToken;

      new UserDao(dbConnection).validateAndUpdateAuthToken(
        acessTokens[0].token,
        Helper.getNewExpirationTime(),
        function (error: any, result: any) {
          expect(result.isValidToken).to.equal.false;
          done();
        });
    });
  });

  //fail testcase
  /*it('should throw error when there are multiple users have same access token', function (done :any){
    let anyUser1: IUser = createAnyUserWithAccessToken();
    let anyUser2: IUser = createAnyUserWithAccessToken();
    //setting acces token of first user to second
    anyUser2.accessToken[0] = anyUser1.accessToken[0];
    let usersToCreate: Array<IUser> = [anyUser1, anyUser2];
    let createdUsers: Array<IUser> = [];
    createMultipleUsers(usersToCreate, createdUsers, function (err) {
      let user1: IUser = createdUsers[0];
      let user2: IUser = createdUsers[1];
      let acessTokens: Array<AccessToken> = user1.accessToken;
      new UserDao(dbConnection).validateAndUpdateAuthToken(
        acessTokens[0].token,
        Helper.getNewExpirationTime(),
        function (error: any, result: any) {
          console.log("is validated token:", result.isValidToken);
          console.log("\nerror :",error);
          expect(error).not.equal.null
          expect(error).to.exist.and.be.instanceof(Error).and.have.property('message', 'multiple users found with given access token details');
          done();
        });
      });
    });*/

  it('should return false when there is no user matching with access token', function (done :any){
    let anyUser: IUser = createAnyUserWithAccessToken();
    let actualToken: AccessToken = anyUser.accessToken[0];
    new UserDao(dbConnection).createUser(anyUser, function (error: any, user: IUser) {
      if (error) throw error;
      expect(user.id).to.have.length.above(0);
      expect(user.accessToken[0]).to.equal(anyUser.accessToken[0]);
      new UserDao(dbConnection).validateAndUpdateAuthToken(
        actualToken.token + "x",
        Helper.getNewExpirationTime(),

        function (error: any, isValidate: Boolean) {
          if (error) throw Error;
          expect(isValidate).to.equal.false;
          done();
        });
    });
  });


  /*  it('should return true when user is found with token : Using Promise',function(done :any){

         let anyUser1 : IUser = createAnyUserWithAccessToken();
         let anyUser2 : IUser = createAnyUserWithAccessToken();
         let usersToCreate : Array<IUser> = [anyUser1,anyUser2];
         let createdUsers : Array<IUser> = [];      
         createMultipleUsers(usersToCreate, createdUsers, function(err){
           let user:IUser=createdUsers[0]; 
           let acessTokens : Array<AccessToken> = user.accessToken; 
           
          
         let userValidateCall : Promise<Boolean> = new UserDao(dbConnection).validateAuthTokenWithPromise(acessTokens[0]);
         userValidateCall
         .then(
           function(isValidToken : Boolean){
             expect(isValidToken).to.be.true;
             done();
           }
         )
         .catch(
           
           function(err: Error){
             throw err;
           }
           
         );
          
                   
         });
    });
   */
});