
var chai = require('chai')
  , chaiHttp = require('chai-http');
let server =require("../util/test-app").getApp;
let expect    = require("chai").expect;
var sinon = require('sinon');

import express = require('express');
import {Request, Response} from "express";
import AuthRouter = require("../../../src/routes/auth-router");
import IAuthController = require('../../../src/controllers/auth-controller');


chai.use(chaiHttp);

    
function getAuthControllerStub(){
   return  {
    registerUser : function(request:Request, response:Response) : void{},
	verifyRegistration : function(request:Request, response:Response, next : any) : void{},
	loginUserByBasicCredential : function(request:Request, response:Response) : void{},
	logoutUser : function(request:Request, response:Response) : void{},
    loginByIp : function(request:Request, response:Response) : void{},
	generateForgotPasswordToken : function(request:Request, response:Response) : void{},
    verifyForgotPasswordToken : function(request:Request, response:Response) : void{},
	resetPassword : function(request:Request, response:Response) : void{},
	updatePassword : function(request:Request, response:Response) : void{},
	validateAccessToken : function(request:Request, response:Response) :void{},
    getOrcidLogin : function(request:Request, response:Response) : void{},
	loginOrRegisterUserByOrcid(request:Request, response:Response) : void{},
    getFacebookLogin(request: Request, response: Response): void{},
	loginOrRegisterUserByFacebook(request: Request, response: Response): void{},
    getTwitterLogin(request: Request, response: Response): void{},
	loginOrRegisterUserByTwitter(request: Request, response: Response): void{},
    getLinkedinLogin(request: Request, response: Response): void{},
	loginOrRegisterUserByLinkedin(request: Request, response: Response): void{},
    getGoogleLogin(request: Request, response: Response): void{},
	loginOrRegisterUserByGoogle(request: Request, response: Response): void{}
   }
}


describe("Auth Router",function(){

    it("should receive GET request with path /forgotpassword and delegate it to authcontoller to generate forgot password token",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.generateForgotPasswordToken=function(request:Request, response:Response){
            response.status(200).send({'username':'someUser'}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'generateForgotPasswordToken');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .get('/user/auth/forgotpassword')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });


    it("should accept a GET request with path /facebook and delegate it to authcontroller to getFacebookLogin", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.getFacebookLogin = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'getFacebookLogin');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/facebook')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    });

    it("should accept a GET request with path /facebook/callback and delegate it to authcontroller to loginOrRegisterUserByFacebook",function(done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.loginOrRegisterUserByFacebook = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'loginOrRegisterUserByFacebook');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/facebook/callback')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    })

    it("should accept a GET request with path /twitter and delegate it to authcontroller to getTwitterLogin", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.getTwitterLogin = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'getTwitterLogin');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/twitter')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            });
    });

    it("should accept a GET request with path /twitter/callback and delegate it to authcontroller to loginOrRegisterUserByTwitter", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.loginOrRegisterUserByTwitter = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'loginOrRegisterUserByTwitter');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/twitter/callback')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    })

     it("should accept a GET request with path /linkedin and delegate it to authcontroller to getLinkedinLogin", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.getLinkedinLogin = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'getLinkedinLogin');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/linkedin')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    });

    it("should accept a GET request with path /linkedin/callback and delegate it to authcontroller to loginOrRegisterUserByLinkedin",function(done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.loginOrRegisterUserByLinkedin = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'loginOrRegisterUserByLinkedin');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/linkedin/callback')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    })

     it("should accept a GET request with path /google and delegate it to authcontroller to getGoogleLogin", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.getGoogleLogin = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'getGoogleLogin');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/google')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    });

    it("should accept a GET request with path /google/callback and delegate it to authcontroller to loginOrRegisterUserByGoogle",function(done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.loginOrRegisterUserByGoogle = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'loginOrRegisterUserByGoogle');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/google/callback')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    })

     it("should accept a GET request with path /orcid and delegate it to authcontroller to getOrcidLogin", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.getOrcidLogin = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'getOrcidLogin');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/orcid')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    });

    it("should accept a GET request with path /orcid/callback and delegate it to authcontroller to loginOrRegisterUserByOrcid",function(done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.loginOrRegisterUserByOrcid = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'loginOrRegisterUserByOrcid');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/orcid/callback')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    })

    it("should accept a GET request with path /loginByIp and delegate it to authcontroller to loginByIp", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.loginByIp = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'loginByIp');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .get('/user/auth/loginByIp')
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err)
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            })
    });

    it("should accept PUT request with path /credentials and delegate it to authcontroller to update password", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        emptyAuthController.updatePassword = function (request: Request, response: Response) {
            response.status(200).send({});
        }

        let authContollerSpy = sinon.spy(emptyAuthController, 'updatePassword');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .put('/user/auth/credentials')
            .send({ "username": "u1", "newPassword": "n1", "oldPassword": "o1" })
            .end(function (err: Error, res: Response) {
                if (err) {
                    return done(err);
                }
                expect(res.status).to.equal(200);
                expect(authContollerSpy.calledOnce).to.be.true;
                done();
            });
    });

    it("should accept PUT request with path /credentials and send message Missing Parameters if username or password are not present in request", function (done :any){
        let emptyAuthController: IAuthController = getAuthControllerStub();
        let authContollerSpy = sinon.spy(emptyAuthController, 'updatePassword');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth", AuthRouter.getRouter());

        chai.request(server)
            .put('/user/auth/credentials')
            .send({ "username": null, "newPassword": "n1", "oldPassword": "o1" })
            .end(function (err: Error, res: Response) {
                expect(res.status).to.equal(500);
                expect(authContollerSpy.calledOnce).to.be.false;
                done();
            });
    });

     it("should not accept GET request with path /credentials",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
           
       let authContollerSpy=sinon.spy(emptyAuthController,'updatePassword');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .get('/user/auth/credentials')
            .end(function(err:Error, res:Response){
                 if (err) {             
                    expect(res.status).to.equal(404);           
                    done();  
             }                    
     });    
    });


    it("should accept PUT request with path /authtokenverification and delegate it to authcontroller to verify auth token",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.validateAccessToken=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'validateAccessToken');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .put('/user/auth/authtokenverification')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });

 it("should not accept GET request with path /authtokenverification",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub();  
       let authContollerSpy=sinon.spy(emptyAuthController,'validateAccessToken');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .get('/user/auth/authtokenverification')
            .end(function(err:Error, res:Response){
                 if (err){
                    expect(res.status).to.equal(404); 
                    expect(authContollerSpy.calledOnce).to.be.false;           
                    done();   
                 }                   
     });    
    });


    it("should accept PUT request with path /registrationverification and delegate it to authcontroller to verify registration",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.verifyRegistration=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'verifyRegistration');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .put('/user/auth/registrationverification')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });

     it("should not accept GET request with path /registrationverification",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        let authContollerSpy=sinon.spy(emptyAuthController,'verifyRegistration');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .get('/user/auth/registrationverification')
            .end(function(err:Error, res:Response){
                 if (err){
                expect(res.status).to.equal(404); 
                expect(authContollerSpy.calledOnce).to.be.false;           
                done();  
                 }            
     });    
    });


     it("should send  Authentication success in response for GET request with path /success ",function(done :any){

        let emptyAuthController : IAuthController = getAuthControllerStub();       
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());
        chai.request(server)
            .get('/user/auth/success')
            .end(function(err:Error, res:Response){
                console.log()
                if (err){
                    return done(err);
                 } 
                 let response=JSON.parse(JSON.stringify(res));
                 expect(response.text).to.be.equal("Authentication success");
                 expect(res.status).to.equal(200); 
                done();                  
          });    
    });

    it("should send 400 with authentication failure message for request with path /failure ",function(done :any){

        let emptyAuthController : IAuthController = getAuthControllerStub();       
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());
        chai.request(server)
            .get('/user/auth/failure')
            .end(function(err:Error, res:Response){
                console.log()
                if (err){
                 let response=JSON.parse(JSON.stringify(res));
                 expect(response.text).to.be.equal("Authentication failure : Invalid credentials");
                 expect(res.status).to.equal(400); 
                done();    
                }              
          });    
    });

     it("should accept POST request with path /signup and delegate it to authcontroller register user",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.registerUser=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'registerUser');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .post('/user/auth/signup')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });

    
     it("should not accept GET request with path /signup",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
           
       let authContollerSpy=sinon.spy(emptyAuthController,'registerUser');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());
         chai.request(server)
            .get('/user/auth/signup')
            .end(function(err:Error, res:Response){
                 if (err){
                    expect(res.status).to.equal(404); 
                    expect(authContollerSpy.calledOnce).to.be.false;           
                    done();     
                 }                 
     });    
    });

     it("should accept POST request with path as /login and delegate it to authcontroller to login user by basic credential",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.loginUserByBasicCredential=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'loginUserByBasicCredential');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .post('/user/auth/login')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });
     
    it("should not accept GET request with path as /login",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
           
       let authContollerSpy=sinon.spy(emptyAuthController,'loginUserByBasicCredential');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .get('/user/auth/login')
            .end(function(err:Error, res:Response){
                 if (err){
                    expect(res.status).to.equal(404); 
                    expect(authContollerSpy.calledOnce).to.be.false;           
                    done();       
                 }               
     });    
    });



    it("should accept POST request with path /logout delegate to authcontroller to logout the user",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.logoutUser=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'logoutUser');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .post('/user/auth/logout')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });

     it("should not accept GET request with path /logout",function(){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
       let authContollerSpy=sinon.spy(emptyAuthController,'logoutUser');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .get('/user/auth/logout')
            .end(function(err:Error, res:Response){
                 if (err){
                    expect(res.status).to.equal(400); 
                    expect(authContollerSpy.calledOnce).to.be.false;                 
                 }               
     });    
    });

   it("should make request with /forgotpassword of type put with required parameters and delegate to authcontroller",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.resetPassword=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'resetPassword');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .put('/user/auth/forgotpassword')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send({ username: 'someUser', resetPasswordToken: '123' ,newPassword:'somePassword'})
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });

    it("should make request with /forgotpassword of type post with required parameters and delegate to authcontroller",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.verifyForgotPasswordToken=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'verifyForgotPasswordToken');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .post('/user/auth/forgotpassword')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });

    it("should make request with /verifySignup of type post with required parameters and delegate to authcontroller",function(done :any){
        let emptyAuthController : IAuthController = getAuthControllerStub(); 
        emptyAuthController.verifyRegistration=function(request:Request, response:Response){
            response.status(200).send({}); 
        }
           
       let authContollerSpy=sinon.spy(emptyAuthController,'verifyRegistration');
        AuthRouter.setAuthController(emptyAuthController);
        server.use("/user/auth",AuthRouter.getRouter());

         chai.request(server)
            .post('/user/auth/verifySignup')
            .end(function(err:Error, res:Response){
                 if (err){
                    return done(err);
                 } 
                expect(res.status).to.equal(200); 
                expect(authContollerSpy.calledOnce).to.be.true;           
                done();                      
     });    
    });


});
