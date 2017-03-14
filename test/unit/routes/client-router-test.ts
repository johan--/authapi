
var chai = require('chai')
  , chaiHttp = require('chai-http');
let server = require("../util/test-app").getApp;
let expect = require("chai").expect;
var sinon = require('sinon');
import express = require('express');
import {Request, Response} from "express";
import ClientRouter = require("../../../src/routes/client-router");
import IClientController = require('../../../src/controllers/client-controller');

chai.use(chaiHttp);

function getClientControllerStub() {
  return {
    addClient: function(request: Request, response: Response): void{ },
    removeClient: function(id: String,  request: Request, response: Response): void{ },
    getClientByClientId: function(request: Request, response: Response): void{ },
    getClientsByUsername: function(request: Request, response: Response): void{ },
    getClientByClientIdAndSecret: function(request: Request, response: Response): void{ },
    updateClientById: function(id: String, client:any, request: Request, response: Response): void{ },
    resetClientSecretById: function(id: String,  request: Request, response: Response): void{ },
  }
}

describe("Client router\n", function(){
    
    it("should accept post request for /client api and delegate it to clientcontroller addClient", function(done :any){
        let emptyClientController: IClientController = getClientControllerStub();
        emptyClientController.addClient = function(request: Request, response: Response){
            response.status(200).send({ 'name': 'someApp' });
        }
        let clientRouter: ClientRouter = new ClientRouter(emptyClientController);
        let clientcontrollerSpy = sinon.spy(emptyClientController, 'addClient');

        server.use("/client", clientRouter.getRouter());
        chai.request(server)
            .post('/client/')
            .end(function(err: Error, res: Response){
                if(err){
                    return done(err);
                }
            expect(res.status).to.equal(200);
            expect(clientcontrollerSpy.calledOnce).to.be.true;
            done();
            })
    });

    it("should accept put request for /client/:id api and delegate it to clientcontroller updateClientById", function(done :any){
        let emptyClientController: IClientController = getClientControllerStub();
        emptyClientController.updateClientById = function(id: String, client:any, request: Request, response: Response){
            response.status(200).send({ 'name': 'someApp' });
        }
        let clientRouter: ClientRouter = new ClientRouter(emptyClientController);
        let clientcontrollerSpy = sinon.spy(emptyClientController, 'updateClientById');

        server.use("/client", clientRouter.getRouter());
        chai.request(server)
            .put('/client/:id')
            .end(function(err: Error, res: Response){
                if(err){
                    return done(err);
                }
            expect(res.status).to.equal(200);
            expect(clientcontrollerSpy.calledOnce).to.be.true;
            done();
            })
    });

    it("should accept put request for /client/resetSecret/:id api and delegate it to clientcontroller resetClientSecretById", function(done :any){
        let emptyClientController: IClientController = getClientControllerStub();
        emptyClientController.resetClientSecretById = function(id: String, request: Request, response: Response){
            response.status(200).send({ 'name': 'someApp' });
        }
        let clientRouter: ClientRouter = new ClientRouter(emptyClientController);
        let clientcontrollerSpy = sinon.spy(emptyClientController, 'resetClientSecretById');

        server.use("/client", clientRouter.getRouter());
        chai.request(server)
            .put('/client/resetSecret/:id')
            .end(function(err: Error, res: Response){
                if(err){
                    return done(err);
                }
            expect(res.status).to.equal(200);
            expect(clientcontrollerSpy.calledOnce).to.be.true;
            done();
            })
    });

    it("should not accept get request for /client/resetSecret/:id api and return error status 404", function(done :any){
        let emptyClientController: IClientController = getClientControllerStub();
        let clientRouter: ClientRouter = new ClientRouter(emptyClientController);
        let clientcontrollerSpy = sinon.spy(emptyClientController, 'resetClientSecretById');

        server.use("/client", clientRouter.getRouter());
        chai.request(server)
            .get('/client/resetSecret/:id')
            .end(function(err: Error, res: Response){
                if(err){
                    expect(res.status).to.equal(404);
                expect(clientcontrollerSpy.calledOnce).to.be.false;
                done();
                }
            })
    });

    it("should accept get request for /client/list api and delegate it to clientcontroller getClientsByUsername", function(done :any){
        let emptyClientController: IClientController = getClientControllerStub();
        emptyClientController.getClientsByUsername = function(request: Request, response: Response){
            response.status(200).send({ 'name': 'someApp' });
        }
        let clientRouter: ClientRouter = new ClientRouter(emptyClientController);
        let clientcontrollerSpy = sinon.spy(emptyClientController, 'getClientsByUsername');

        server.use("/client", clientRouter.getRouter());
        chai.request(server)
            .get('/client/list')
            .end(function(err: Error, res: Response){
                if(err){
                    return done(err);
                }
            expect(res.status).to.equal(200);
            expect(clientcontrollerSpy.calledOnce).to.be.true;
            done();
            })
    });

    it("should not accept post request for /client/:id api and return error status 404", function(done :any){
        let emptyClientController: IClientController = getClientControllerStub();
        
        let clientRouter: ClientRouter = new ClientRouter(emptyClientController);
        let clientcontrollerSpy = sinon.spy(emptyClientController, 'updateClientById');

        server.use("/client", clientRouter.getRouter());
        chai.request(server)
            .post('/client/:id')
            .end(function(err: Error, res: Response){
             if (err) {
                expect(res.status).to.equal(404);
                expect(clientcontrollerSpy.calledOnce).to.be.false;
                done();
                }
            });
         });
    

});