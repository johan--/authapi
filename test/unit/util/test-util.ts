
import express = require("express");
import {Request} from "express";
import log4js = require('log4js');
import ITokenManager= require('../../../src/token/tokenmanager');
import IUserDao = require('../../../src/model/dao/user-dao');
import IClientDao = require('../../../src/model/dao/client-dao');
import IAccessDao = require('../../../src/model/dao/access-dao');
import IConsentDao = require('../../../src/model/dao/consent-dao');
import IUser = require("../../../src/model/entity/user");
import IClient = require("../../../src/model/entity/client");
import IAccess = require("../../../src/model/entity/access")
import IConsent = require("../../../src/model/entity/consent")
import AccessToken = require("../../../src/model/entity/access-token");
import AccessTokenUtil = require("../../../src/passport/access-token-util");
import Consent = require("../../../src/model/entity/consent");
import EmailService = require('../../../src/email/email-service');

class TestUtil{
    
    public  createUserDao() : IUserDao{
         let userDao : IUserDao = {
            createUser : function (user: IUser, callback: (error:any, user:IUser) => void) : void{},
            getUserByUserId: function (id:String, callback : (error:Error, user:IUser) => void ) : void{},
            getUserByUserName: function (username: String, callback: (error:any, user:IUser) => void) : void{}  ,
            searchUsers: function (searchCriteria: Object, callback: (error:any, users : Array<IUser>) => void) : void{},
            updateUser: function (id: String, updatedData : Object, callback: (error:any, user:IUser) => void) : void{},
            removeUser: function (id: String, callback: (error:any, user:IUser) => void) : void{},
            validateAndUpdateAuthToken: function (accessToken:String,newExpirationTime:Number, callback : (error:Error, isValidToken:Boolean) => void ) : void{},
            getUserByAuthToken(tokenSearchCriteria:Object, callback : (error:Error, user:IUser) => void ) : void{},
            listUser(searchCriteria: Object, callback: (error: any, users: Array<IUser>) => void): void{},
            //validateAuthTokenWithPromise(tokenSearchCriteria:Object) : Promise<Boolean> {return null}
          }
         return userDao;
    }

    public createClientDao() : IClientDao{
        let clientDao : IClientDao = {
            addClient: function(client: IClient, callback: (error:any, client:IClient) => void): void{ },
            getClientByClientId: function(clientId:String, callback: (error:any, client:IClient) => void): void{ },
            getClientsByUsername: function(username:String, callback: (error: any, clients: Array<IClient>) => void): void{ },
            getClientByClientIdAndSecret: function(clientId:String,clientSecret:String, callback: (error: any, client: IClient) => void): void{ },
            updateClientById: function(id:String,updatedClient : Object, callback: (error: any, client: IClient) => void): void{ },
            getClient: function(criteria:String, callback: (error: any, client: IClient) => void): void{ },
            getClientById : function(id: string, callback: (error: any, client: IClient) => void): void{ },
            removeClient : function(id:String, callback: (error: any, client: IClient) => void): void{ }
          }
         return clientDao;
    }

    public createAccessDao() : IAccessDao{
        let accessDao : IAccessDao = {
            insertToAccess: function(access: IAccess, callback: (error: any, access: IAccess) => void): void{ },
            updateAccess: function(access: IAccess, updatedData: any ,callback: (error: any, access: IAccess) => void): any{},
            findAccess: function(criteria: any, callback: (error: any, access: Array<IAccess>) => void): any{},
            removeAccess: function(criteria: any, callback: (error: any) => void): any{},
            getToken:  function(criteria: any,callback: (error: any, access: IAccess) => void): void{ }
        }
        return accessDao;
    }

    public createConsentDao(): IConsentDao {
        let consentDao: IConsentDao = {
            createConsent: function (access: IConsent, callback: (error: any, access: IConsent) => void): void { },
            findConsent: function (criteria: any, callback: (error: any, access: IConsent) => void): any { },
            removeConsent: function (criteria: any, callback: (error: any) => void): any { }
        }
        return consentDao;
    }
   /* public createAccessTokenUtil(userApi:IUserDao,tokenApi:ITokenManager,accessApi:,null,clientApi:):AccessTokenUtil{
          let accessTokenUtil:AccessTokenUtil = {
               userDao: IUserDao=;
              tokenManager: ITokenManager;
               accessDao: IAccessDao;
              userFactory: UserFactory;
              clientDao: IClientDao;
              clearExpiredAndCreateNewToken: function (accessTokens: Array<AccessToken>, clientInfo: any, username: String, userType: String): void{},
              createAccessToken : function (request: Request,user: IUser,done: any):void{},
              insertToAccess: function (req: Request, client: any, user: IUser, done: any):void{}
           }
           return accessTokenUtil;
    }*/

  public createAnyUserWithAccessToken() {
  var uniqueAccessNumber = Math.floor(Math.random() * (100 - 0) + 0);
  var user = this.createAnyUser();
  user.accessToken = [
    {
      token: 'token123' + uniqueAccessNumber,
      expiry: null,
      username: user.username,
      clientId: "client" + uniqueAccessNumber,
      type : "user-access-token",
      idToken : "",
	   scope : ""
    }
  ]
  return user;


}
  
  public createAnyUser(): any {
    var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
    return {
    id: String('null'),
    _id: String('null'),
    userType:"customer",
    username : "username"+uniqueNumber, 
    firstName : "fname"+uniqueNumber,
    lastName : "lname"+uniqueNumber,
    organization : "org"+uniqueNumber,    
    jobTitle : "job"+uniqueNumber,
    dob : new Date(),
    language : "lan"+uniqueNumber,
    mobilePhone : ""+uniqueNumber,
    homePhone : ""+uniqueNumber,
    businessPhone : ""+uniqueNumber,
    fax : ""+uniqueNumber,
    email : "username"+uniqueNumber,
    createdOn : null,
    address : {
		addressLine1 : "addr1"+uniqueNumber,
		addressLine2 : "addr2"+uniqueNumber,
		city : "city"+uniqueNumber,
		state : "state"+uniqueNumber,
		country : "country"+uniqueNumber,
		zipCode : ""+uniqueNumber
	},
    credential : {
		username:"username"+uniqueNumber,
		password:"Passwoord@"+uniqueNumber
	},
  accessToken : Array<AccessToken>(),
    isValidated : false,
    registrationVerificationToken : String(null),
    registrationVerificationTokenExpiry : new Date().getTime()+60*1000,
    consents : Array<Consent>(),
    clients : Array<IClient>()
	};
}

public createAnyClient(){
  var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
  return{
    id: "",
    name : "clientApp"+uniqueNumber,
    username: "username"+uniqueNumber,
    clientId: "clientId"+uniqueNumber,
    clientSecret: "clientSecret"+uniqueNumber,
    credentialsFlow: true,
    redirect_uris:["www.app"+uniqueNumber+"1.com","www.app"+uniqueNumber+"2.com"]
  }
}

public createAnyAccess():IAccess{
  var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
  return {
    type: "type"+uniqueNumber,
    token:"token"+uniqueNumber,
    idToken: "idToken"+uniqueNumber,
    scope: ["scope1", "scope2"],
    expiresIn: uniqueNumber,
    expiresOn: uniqueNumber+1,
    user: "user"+uniqueNumber,
    auth:"auth"+uniqueNumber,
    client: "client"+uniqueNumber
  }
}


public createTokenManagerStub() :ITokenManager{
   return {
        generateRandomToken(): String {return null},
	createJwtToken(username: String, userType: String, createdOn: Number, client: String): String {return null},
	authenticateJwtToken(username: String, token: String): Boolean {return false}
   };
}

public  getEmailService() : EmailService{ 
    let emailService:EmailService ={
        sendRegistrationMail :function(user:IUser): void{},
        sendRegistrationConfirmationMail : function(user:IUser): void{},
        sendPasswordChangeMail :function(user:IUser): void{},
        sendForgetPasswordMail : function(user:IUser): void{}
    }
    return emailService;
}

public createSomeAccessToken(expiryDuration:number) : AccessToken{
  var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
  if(null == expiryDuration){
    expiryDuration = 300000; // 5 minutes
  }
  return   {
      token: 'token' + uniqueNumber,
      expiry: new Date().getTime() + expiryDuration,
      username: "username"+uniqueNumber,
      clientId: "client" + uniqueNumber,
      type : "user-access-token",
      idToken : "",
	   scope : ""
    }
}

public sendOrgDetails(): any{
    return {
        "metadata": {
            "status": "success",
            "message": {}
            },
        "data": {
            "access_type": true,
            "create_token": true,
            "orgDeatils": {
            "ip_access_control_id": "3",
            "ip_start": "131.111.0.0",
            "ip_end": "131.111.255.255",
            "access_type": true,
            "party_id": "1",
            "db_add_date": "2016-11-09T02:05:33.312Z",
            "db_update_date": "2016-11-09T02:05:33.312Z"
                }           
             }
        }
    }


public createOrcidProfile():any{
 return {
	"orcid-profile": {
		"orcid-history": {
			"last-modified-date": 23/7/2016
		},
		"orcid-identifier": {
			"path": "testUser@gmail.com"
		},
		"orcid-bio": {
			"personal-details": {
				"given-names": {
					"value": "testUserGivenName"
				},
				"family-name": {
					"value": "testUserFamilyName"
				},
         "other-names":{
                   "other-name": [ 
                     {
                        "value" :"OtherName"
                    }
                   ]
           },
                "credit-name" :{ "value" : "someName"}
		   	},
            "contact-details":{
                "email" : [{
                    "value" : "testUser@gmail.com"
                }]
            }
		    },
        "orcid-activities":{
            "orcid-works":{
                "orcid-work":[
                    { "work-contributors":{
                        "contributor":[
                            {
                                "contributor-orcid":{
                                    "uri":"someUri1/Id1"
                                },
                                "credit-name" :{
                                    "value":"someActivityCreditName1"
                                },
                                "contributor-email":{
                                    "value":"contributerEmail1@gmail.com"
                                },
                                 "contributor-attributes":{
                                    "contributor-role":"role1"
                                }
                            },
                             {
                                "contributor-orcid":{
                                    "uri":"someUri2/Id2"
                                },
                                "credit-name" :{
                                    "value" :"someActivityCreditName2"
                                },
                                "contributor-email":{
                                    "value":"contributerEmail2@gmail.com"
                                },
                                 "contributor-attributes":{
                                    "contributor-role":"role2"
                                }
                            }
                        ]
                    }
                    }
                ]
            },
            "funding-list": {
                "funding":[
                    {
                        "funding-type":"someFundingType",
                        "visibility":"public",
                        "organization":{
                            "name" : "someName",
                            "address" : {
                            "city" : "somecity",
                            "country" : "somecountry",
                            "region"  : "someregion"
                            }
                        },
                        "amount":{
                            "currency-code" : "someCode"
                        },
                        "start-date" : {
                            "day" :{
                                "value" : 12
                            },
                            "month" :{
                                "value" : "August"
                            },
                            "year" : {
                                "value" : 2016
                            }
                        },
                        "end-date" : {
                            "day" :{
                                "value" : 12
                            },
                            "month" :{
                                "value" : "October"
                            },
                            "year" : {
                                "value" : 2017
                            }
                        },
                        "url" : {
                            "value" : "someUrl"
                        },
                        "funding-external-identifiers" :{
                            "funding-external-identifier":[
                              {
                                "funding-external-identifier-type":"GRANT_NUMBER",
                                "funding-external-identifier-value" : 123
                              }
                            ]
                        }

                    }
                ]
            },
            "affiliations":{
                "affiliation" : [
                    {
                        "type" :"EMPLOYMENT",
                        "organization" :{
                            "name" : "someName",
                            "address" : {
                                "city" : "someCity",
                                "country" : "someCity",
                                "region" : "someregion"
                            }

                        },
                       "visibility" : "public",
                       "start-date":{
                            "day" :{
                                "value" : 12
                            },
                            "month" :{
                                "value" : "August"
                            },
                            "year" : {
                                "value" : 2016
                            }
                        },
                        "end-date" : {
                            "day" :{
                                "value" : 12
                            },
                            "month" :{
                                "value" : "October"
                            },
                            "year" : {
                                "value" : 2017
                            }
                        },
                        "role-title" : "someRoleTitle",
                        "department-name" : "someDeptName"
                    }
                ]
            }
        }
	}
}
}

}
export = TestUtil;