import MongoUserDao = require("../../../../src/model/mongo/dao/user-dao-mongo");
import IUser = require("../../../../src/model/entity/user");

let Q = require('q');
let app = require('../../../../src/app/app');
let conn = app.connection;
let ObjectID = require("mongodb").ObjectID;

const userDao = new MongoUserDao(conn);
const userModel = userDao.UserModel;
const accessModel = userDao.AccessModel;      

export class DBUtility {
    GetVerifyRegistrationToken(username: string) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();
        this.findUser(username)
        .then((user : IUser) => { deferred.resolve(user.registrationVerificationToken); })
        .fail((err : Error) => { deferred.reject(err); }).done();

        return deferred.promise;
    }

    RemoveSignUpSuiteRecords(username: string) : Q.Promise<any> {  
        let deferred : Q.Deferred<any> = Q.defer();
        this.findUser(username)
        .then((user : IUser) => { return this.removeAccessModel(user); })
        .then((user : IUser) => { return this.removeUserModel(user); })
        .then((user : IUser) => { deferred.resolve(); })
        .fail((err : Error) => { deferred.reject(err); }).done();   

        return deferred.promise;
    }

    RemoveLoginSuiteRecords(username: string) : Q.Promise<any> {  
        let deferred : Q.Deferred<any> = Q.defer();
        this.findUser(username)
        .then((user : IUser) => { return this.removeAccessModel(user); })
        .then((user : IUser) => { return this.removeUserModel(user); })
        .then((user : IUser) => { deferred.resolve(); })
        .fail((err : Error) => { deferred.reject(err); }).done();    

        return deferred.promise;
    }

    private findUser(username : string) : Q.Promise<any> {
        let userDeferred : Q.Deferred<any> = Q.defer();
        userModel.findOne({ username }, function(err: any, user: IUser) {
            if(err) { 
                userDeferred.reject(err);
            }         
            else {
                userDeferred.resolve(user);
            }
        });
        return userDeferred.promise;
    }

    private removeUserModel(user : IUser) : Q.Promise<any> {
        let userDeferred : Q.Deferred<any> = Q.defer();
        userModel.remove({ username : user.username }, function(err:Error) {
            if(err) { 
                userDeferred.reject(err);
            }         
            else {
                userDeferred.resolve(user);
            }
        });
        return userDeferred.promise;
    }

    private removeAccessModel(user : IUser) : Q.Promise<any> {
        let accessDeferred : Q.Deferred<any> = Q.defer();
        accessModel.remove({ user : (<any>user)._id }, function(err:Error) {
            if(err) { 
                accessDeferred.reject(err);
            }         
            else {
                accessDeferred.resolve(user);
            }
        });
        return accessDeferred.promise;
    }
}