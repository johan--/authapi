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
let profile : any, profileSignUp : any;

describe("Login user journey",function() {

    beforeEach(function() { 
        profile = {
	          username: "api_database_integration_test_user_login@integtest.tnf",
	          password: "Password1!",
	          userType: "librarian",
	          email: "api_database_integration_test_user_login@integtest.tnf",
	          firstName: "api_database",
	          lastName: "user"
        }; 
    }); 

    it('should return user details when successfull signup', function (done:any) {     
        this.timeout(cleanUpTimeOut);
        chai.request(app)
        .post('/auth/user/auth/signup')
        .send(profile)
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(200);        
            expect(responseData.data.username).to.equal(profile.username);
            expect(responseData.data.firstName).to.equal(profile.firstName);
            expect(responseData.data.lastName).to.equal(profile.lastName);
            expect(responseData.data.email).to.equal(profile.email);    
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
                done();
            });
        }).done();
    });

    it('should throw 404 internal server error for missing username', function (done:any) {
        profile.username = null;      
        chai.request(app)
        .post('/auth/user/auth/login')
        .send(profile)
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.metadata.message.message).to.equal('Missing credentials');
            done();       
        });
    });

    it('should throw 404 internal server error for wrong username', function (done:any) {
        profile.username = "api_database_integration_test";      
        chai.request(app)
        .post('/auth/user/auth/login')
        .send(profile)
        .end(function(err:Error, res:any) {
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.metadata.message.key).to.equal('EMAIL_ADDRESS');
            expect(responseData.metadata.message.value).to.equal('Invalid email address.');
            done(); 
        });    
    });

    it('should throw 404 internal server error for missing password', function (done:any) {
        profile.password = null;      
        chai.request(app)
        .post('/auth/user/auth/login')
        .send(profile)
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.metadata.message.message).to.equal('Missing credentials');
            done();       
        });
    });

    it('should throw 404 internal server error for wrong password', function (done:any) {
        profile.password = "Tricon13#";      
        chai.request(app)
        .post('/auth/user/auth/login')
        .send(profile)
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.metadata.message.key).to.equal('PASSWORD');
            expect(responseData.metadata.message.value).to.equal('Password is incorrect.');
            done(); 
        });
    });

    it('should throw 404 internal server error for wrong username', function (done:any) {
        profile.username = "api_database_integration_test@test123.com";      
        chai.request(app)
        .post('/auth/user/auth/login')
        .send(profile)
        .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(404);
            expect(responseData.metadata.message.key).to.equal('EMAIL_ADDRESS');
            expect(responseData.metadata.message.value).to.equal('Invalid email address.');
            done(); 
        });
    });

    it('should return user details with accessToken upon successfull login', function (done:any) {               
        chai.request(app)
        .post('/auth/user/auth/login')
        .send(profile)
            .end(function(err:Error, res:any){
            var responseData : any = JSON.parse(res.text);
            expect(res.status).to.equal(201);        
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
    });
});