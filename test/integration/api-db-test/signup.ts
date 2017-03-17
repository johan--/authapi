import authRouter = require('../../../src/routes/auth-router');
import express = require('express');
import { Request, Response } from "express";
import { DBUtility } from "./utility/dbUtility";

var app = require('../../../src/app/app');
var chai = require('chai');
let expect = require("chai").expect;
var chaiHttp = require('chai-http');
var cleanUpTimeOut : number = 60000;

chai.use(chaiHttp);
let profile :any;

describe("Sign up journey",function() {    
    this.timeout(cleanUpTimeOut);

    beforeEach(function() { 
        profile = {
	          username: "api_database_integration_test_user_signup@integtest.tnf",
	          password: "Password1!",
	          userType: "librarian",
	          email: "api_database_integration_test_user_signup@integtest.tnf",
	          firstName: "api_database",
	          lastName: "user"
	        }; 
    });  	         

    it('should throw 404 internal server error for invalid password format', function (done:any) {
        profile.password = 'hhhhhh';      
        chai.request(app)
        .post('/auth/user/auth/signup')
        .send(profile)
        .end(function(err: Error, res: any){            
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.metadata.message.key).to.equal('PASSWORD');
            expect(responseData.metadata.message.value).to.equal('Password must be at least 8 characters long and include at least one of each of 0-9, a-z, A-Z and Symbol (e.g. ! # ? $).');
            done();
        });
    });
    
    it('should throw 404 internal server error for missing password', function (done:any) {
        profile.password = null;      
        chai.request(app)
        .post('/auth/user/auth/signup')
        .send(profile)
        .end(function(err:Error, res: any){  
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.data.message).to.equal('Missing credentials');
            done();   
        });
    });

     it('should throw 404 internal server error for invalid username(username should be email address format)', function (done:any) {
        profile.username = 'testuser';      
        chai.request(app)
        .post('/auth/user/auth/signup')
        .send(profile)
        .end(function(err:Error, res:any) {     
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.metadata.message.key).to.equal('EMAIL_ADDRESS');
            expect(responseData.metadata.message.value).to.equal('Invalid email address.');
            done();  
        });
    });

    it('should throw 404 internal server error for missing username', function (done:any) {
        profile.username = null;      
        chai.request(app)
        .post('/auth/user/auth/signup')
        .send(profile)
        .end(function(err:Error, res:any) {
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.data.message).to.equal('Missing credentials');
            done();   
        });
    });

	it('should return user details when successfull signup', function (done:any) {     
        this.timeout(cleanUpTimeOut);
        chai.request(app)
        .post('/auth/user/auth/signup')
        .send(profile)
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(201);        
            expect(responseData.data.username).to.equal(profile.username);
            expect(responseData.data.firstName).to.equal(profile.firstName);
            expect(responseData.data.lastName).to.equal(profile.lastName);
            expect(responseData.data.email).to.equal(profile.email);    
            done();
        });
    });

	it('should return http status 409 when verification token is incorrect', function (done:any) {     
        chai.request(app)
        .post('/auth/user/auth/verifySignup')
        .send({ username : profile.username, registrationVerificationToken : "incorrect" })
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(409);        
            expect(responseData.metadata.message.key).to.equal('VERIFICATION_CODE');
            expect(responseData.metadata.message.value).to.equal('Verification code is incorrect.');  
            done();
        });
    });

	it('should return http status 404 when verification token is not sent', function (done:any) {     
        chai.request(app)
        .post('/auth/user/auth/verifySignup')
        .send({ username : profile.username })
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);        
            expect(responseData.metadata.message.key).to.equal('UNEXPECTED_ERROR');
            expect(responseData.metadata.message.value).to.equal('missing parameters : username or registrationverificationtoken not present in request');  
            done();
        });
    });

	it('should return http status 404 when username is not sent', function (done:any) {     
        chai.request(app)
        .post('/auth/user/auth/verifySignup')
        .send({ registrationVerificationToken : "incorrect" })
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);        
            expect(responseData.metadata.message.key).to.equal('UNEXPECTED_ERROR');
            expect(responseData.metadata.message.value).to.equal('missing parameters : username or registrationverificationtoken not present in request');  
            done();
        });
    });

	it('should return user details with accessToken upon successfull registration verification', function (done:any) {     
        let dbUtil: DBUtility = new DBUtility();
        dbUtil.GetVerifyRegistrationToken(profile.username)
        .then((verificationToken : string) => {
            chai.request(app)
            .post('/auth/user/auth/verifySignup')
            .send({ username : profile.username, registrationVerificationToken : verificationToken })
            .end(function(err:Error, res:any){
                var responseData : any = JSON.parse(res.text);
                expect(res.status).to.equal(200);        
                expect(responseData.data.username).to.equal(profile.username);
                expect(responseData.data.firstName).to.equal(profile.firstName);
                expect(responseData.data.lastName).to.equal(profile.lastName);
                expect(responseData.data.email).to.equal(profile.email);  
                expect(responseData.data.accessToken.length).to.be.above(0);
                expect(responseData.data.accessToken[0].idToken).to.not.be.null;
                
                let dbUtil: DBUtility = new DBUtility();
                dbUtil.RemoveSignUpSuiteRecords(profile.username)
                .then(() => { 
                    console.log("Signup test suite, DB clean up successfull.");
                    done();
                })
                .fail((err : Error) => {
                    console.log("Signup test suite, DB clean up failed.");
                    done(err);
                }).done();
            });
        }).done();
    });
});