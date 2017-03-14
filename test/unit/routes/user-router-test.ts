
var chai = require('chai')
  , chaiHttp = require('chai-http');
let server = require("../util/test-app").getApp;
let expect = require("chai").expect;
var sinon = require('sinon');
import express = require('express');
import {Request, Response} from "express";
import UserRouter = require("../../../src/routes/user-router");
import IUserController = require('../../../src/controllers/user-controller');

chai.use(chaiHttp);

function getUserControllerStub() {
  return {
    listUser: function (searchCriteria: any, request: Request, response: Response): void { },
    getUserById: function (id: String, request: Request, response: Response): void { },
    updateUser: function (id: String, user: any, request: Request, response: Response): void { },
    removeUser: function (id: String, request: Request, response: Response): void { },
    searchUsers: function (searchCriteria: any, request: Request, response: Response): void { },
    getUserByAuthToken: function (request: Request, response: Response): void { }
  }
}


describe("User router", function () {

  it("should accept GET request with path /user/:id and delegate it to usercontroller to get user by id", function (done :any){
    let emptyUserController: IUserController = getUserControllerStub();
    emptyUserController.getUserById = function (id: String, request: Request, response: Response) {
      response.status(200).send({ 'username': 'someUser' });
    }

    let userRouter: UserRouter = new UserRouter(emptyUserController);
    let userContollerSpy = sinon.spy(emptyUserController, 'getUserById');

    server.use("/user", userRouter.getRouter());
    chai.request(server)
      .get('/user/:id')
      .end(function (err: Error, res: Response) {
        if (err) {
          return done(err);
        }
        expect(res.status).to.equal(200);
        expect(userContollerSpy.calledOnce).to.be.true;
        done();
      });
  });


  it("should accept POST request with path /user/search of type post and delegate it to usercontroller search", function (done :any){

    let emptyUserController: IUserController = getUserControllerStub();

    emptyUserController.searchUsers = function (requestBody: any, request: Request, response: Response) {
      response.status(200).send({ 'username': 'someUser' });
    }

    let userRouter: UserRouter = new UserRouter(emptyUserController);
    let userContollerSpy = sinon.spy(emptyUserController, 'searchUsers');

    server.use("/user", userRouter.getRouter());
    chai.request(server)
      .post('/user/search')
      .end(function (err: Error, res: Response) {
        if (err) {
          return done(err);
        }
        expect(res.status).to.equal(200);
        expect(userContollerSpy.calledOnce).to.be.true;
        done();
      });
  });


  it("should accept PUT request with path /user/:id and delegate it to  usercontroller update user", function (done :any){

    let emptyUserController: IUserController = getUserControllerStub();
    emptyUserController.updateUser = function (id: String, requestBody: any, request: Request, response: Response) {
      response.status(200).send({ 'username': 'someUser' });
    }

    let userRouter: UserRouter = new UserRouter(emptyUserController);
    let userContollerSpy = sinon.spy(emptyUserController, 'updateUser');

    server.use("/user", userRouter.getRouter());
    chai.request(server)
      .put('/user/:id')
      .end(function (err: Error, res: Response) {
        if (err) { return done(err); }
        expect(res.status).to.equal(200);
        expect(userContollerSpy.calledOnce).to.be.true;
        done();
      });
  });


  it("should accept DELETE request with path /user/:id and delegate it to usercontroller remomve user", function (done :any){

    let emptyUserController: IUserController = getUserControllerStub();
    emptyUserController.removeUser = function (id: String, request: Request, response: Response) {
      response.status(200).send({});
    }

    let userRouter: UserRouter = new UserRouter(emptyUserController);
    let userContollerSpy = sinon.spy(emptyUserController, 'removeUser');

    server.use("/user", userRouter.getRouter());
    chai.request(server)
      .delete('/user/:id')
      .end(function (err: Error, res: Response) {
        if (err) { return done(err); }
        expect(res.status).to.equal(200);
        expect(userContollerSpy.calledOnce).to.be.true;
        done();
      });
  });


  it("should not accept POST request with PATH /user/:id and return error 404  ", function (done :any){

    let emptyUserController: IUserController = getUserControllerStub();

    let userRouter: UserRouter = new UserRouter(emptyUserController);
    let userContollerSpy = sinon.spy(emptyUserController, 'removeUser');

    server.use("/user", userRouter.getRouter());
    chai.request(server)
      .post('/user/:id')
      .end(function (err: Error, res: Response) {
        if (err) {
          expect(res.status).to.equal(404);
          expect(userContollerSpy.calledOnce).to.be.false;
          done();
        }
      });
  });

  it("should accept GET request with path /user/self and delegate it to usercontroller to get user by auth token", function (done :any){
    let emptyUserController: IUserController = getUserControllerStub();
    emptyUserController.getUserByAuthToken = function (request: Request, response: Response) {
      response.status(200).send({ 'username': 'someUser' });
    }

    let userRouter: UserRouter = new UserRouter(emptyUserController);
    let userContollerSpy = sinon.spy(emptyUserController, 'getUserByAuthToken');

    server.use("/user", userRouter.getRouter());
    chai.request(server)
      .get('/user/self')
      .end(function (err: Error, res: Response) {
        if (err) {
          return done(err);
        }
        expect(res.status).to.equal(200);
        expect(userContollerSpy.calledOnce).to.be.true;
        done();
      });
  });

   it("should accept GET request with path /user/list and delegate it to usercontroller to listUser", function (done :any){
    let emptyUserController: IUserController = getUserControllerStub();
    emptyUserController.listUser = function (searchcriteria:any,request: Request, response: Response) {
      response.status(200).send({ 'username': 'someUser' });
    }

    let userRouter: UserRouter = new UserRouter(emptyUserController);
    let userContollerSpy = sinon.spy(emptyUserController, 'listUser');

    server.use("/user", userRouter.getRouter());
    chai.request(server)
      .get('/user/list')
      .end(function (err: Error, res: Response) {
        if (err) {
          return done(err);
        }
        expect(res.status).to.equal(200);
        expect(userContollerSpy.calledOnce).to.be.true;
        done();
      });
  });


});