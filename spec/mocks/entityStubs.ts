'use strict'

import * as mongoose from "mongoose";
import { User } from "../../src/model/entity/user";
import { Client } from "../../src/model/entity/client";
import { Consent } from "../../src/model/entity/consent";
import { Access } from "../../src/model/entity/access";
import { AccessToken } from "../../src/model/entity/access-token";
import { RefreshToken } from "../../src/model/entity/refresh-token";
import { AuthorizationCode } from "../../src/model/entity/authcode";
import { EncryptionUtil } from '../../src/util/encryption';


export class EntityStubs {
    static createAnyUser() : any {
        var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
        var objId = EntityStubs.randomObjectId();
        return {
            id: objId,
            _id: objId,
            userType:"customer",
            username : "username" + uniqueNumber + "@unittest.com", 
            firstName : "fname" + uniqueNumber,
            lastName : "lname" + uniqueNumber,
            organization : "org" + uniqueNumber,    
            jobTitle : "job" + uniqueNumber,
            dob : new Date(),
            email : "username" + uniqueNumber + "@unittest.com",
            createdOn : null,
            gender : "F",
            mobilePhone : "mob" + uniqueNumber,
            fax : "fax" + uniqueNumber,
            address : "address" + uniqueNumber,
            credential : {
                username:"username" + uniqueNumber + "@unittest.com",
                password:EncryptionUtil.encrypt("Passwoord@" + uniqueNumber),
                passwordRaw:"Passwoord@" + uniqueNumber,
                resetPasswordToken:"token" + uniqueNumber
            },
            accessToken : Array<AccessToken>(),
            isValidated : false,
            registrationVerificationToken : "token" + uniqueNumber,
            registrationVerificationTokenExpiry : new Date().getTime() + 60*1000,
            consents : Array<Consent>(),
            clients : Array<Client>()
        };
    }

    static createAnyClient() : any {
        var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
        var objId = EntityStubs.randomObjectId();
        return {
            id: objId,
            _id: objId,
            name : "clientApp" + uniqueNumber,
            username: "username" + uniqueNumber + "@unittest.com",
            clientId: "clientId" + uniqueNumber,
            clientSecret: "clientSecret" + uniqueNumber,
            credentialsFlow: true,
            redirect_uris:["www.app" + uniqueNumber + "1.com","www.app" + uniqueNumber + "2.com"]
        }
    }

    static createAnyAccess() : Access {
        var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
        return {
            type: "type" + uniqueNumber,
            token:"token" + uniqueNumber,
            idToken: "idToken" + uniqueNumber,
            scope: ["scope1", "scope2"],
            expiresIn: uniqueNumber,
            expiresOn: uniqueNumber + 1,
            user: "user" + uniqueNumber,
            auth:"auth" + uniqueNumber,
            client: "client" + uniqueNumber
        }
    }

    static createSomeAccessToken(expiryDuration:number) : AccessToken {
        var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
        if(null == expiryDuration){
            expiryDuration = 300000; // 5 minutes
        }
        return   {
            token: 'token' + uniqueNumber,
            expiry: new Date().getTime() + expiryDuration,
            username: "username" + uniqueNumber + "@unittest.com",
            clientId: "client" + uniqueNumber,
            type : "user-access-token",
            idToken : "",
            scope : ""
        }
    }

    static monthAdd(date : Date, month : number) {
        let temp : Date = date;
        temp = new Date(date.getFullYear(),date.getMonth(), 1);
        temp.setMonth(temp.getMonth() + (month + 1));
        temp.setDate(temp.getDate() - 1); 
        if (date.getDate() < temp.getDate()) { 
            temp.setDate(date.getDate()); 
        }
        return temp;
    }

    static waitForControllerResults(callback : Function) {
        setTimeout(callback, 1000);
    }

    static randomObjectId() {
        return new mongoose.mongo.ObjectId();
    }  
    
    static createAuthObject(userId : string, clientId : string): any {
        var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
         var objId = EntityStubs.randomObjectId();
        return {
            id: objId,
            _id: objId,
            user: userId,
            client: clientId,
            sub: userId,
            scope: [
                "mail",
                "openid",
                "profile",
                "foo"
            ],
            code: "code" + uniqueNumber,
            redirectUri: "http://localhost:3001/login/callback",
            responseType: "code",
            status: "created"
        }

    }


    static createRefreshToken() : RefreshToken {
        var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
        return {
            token: "token" + uniqueNumber,
            status : "created",
            auth : "auth" + uniqueNumber,
            scope: [
                "mail",
                "openid",
                "profile",
                "foo"
            ]
        };
    }
}