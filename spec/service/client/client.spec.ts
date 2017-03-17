'use strict'

import * as chai from "chai";
import { assert } from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as Q from 'q';
import { User } from "../../../src/model/entity/user";
import { Client } from "../../../src/model/entity/client";
import { Access } from "../../../src/model/entity/access";
import { IClientService } from "../../../src/service/client/interface/client";
import { ClientService } from "../../../src/service/client/impl/client";
import { MockDaoFactory } from "../../mocks/mockDaoFactory";
import { IDaoFactory } from "../../../src/model/dao/iDaoFactory";
import { EntityStubs } from "../../mocks/entityStubs";

describe ('Client service', () => {
    let clientService : IClientService;
    let daoFactory : IDaoFactory;

    beforeEach(() => {
        daoFactory = new MockDaoFactory();
        clientService = new ClientService(daoFactory);
    });

    it('should add client', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        let AddClientDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().addClient;
        let getUserByUsernameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        AddClientDaoStub.returns(Q.resolve(clientObj));
        getUserByUsernameDaoStub.returns(Q.resolve(userObj))

        var promise = clientService.addClient(userObj.username, clientObj.name, clientObj.redirect_uris);
        promise.then((data : Client) => {
            try {
                assert.equal(data.name, clientObj.name);
                assert.equal(data.clientId, clientObj.clientId);
                assert.equal(data.clientSecret, clientObj.clientSecret);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done();  } catch(e) { done(e); } });
        
        AddClientDaoStub.reset();
        getUserByUsernameDaoStub.reset();
    });

    it('should throw exception if client user not available while adding client', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let clientObj : Client = EntityStubs.createAnyClient();

        let AddClientDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().addClient;
        let getUserByUsernameDaoStub : sinon.SinonStub = <any>daoFactory.getUserDao().getUserByUserName;
        AddClientDaoStub.returns(Q.resolve(clientObj));
        getUserByUsernameDaoStub.returns(Q.resolve(undefined))

        var promise = clientService.addClient(userObj.username, clientObj.name, clientObj.redirect_uris);
        promise.then((data : Client) => {
            try {
                assert.equal(false, true, "Should have thrown error"); 
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal("no user found with given username:" + userObj.username, err.message); done(); } catch(e) { done(e); } });
        
        AddClientDaoStub.reset();
        getUserByUsernameDaoStub.reset();
    });

    it('should remove client', (done) => {
        let clientObj : Client = EntityStubs.createAnyClient();
        let removeClientDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().removeClient;

        var promise = clientService.removeClient(clientObj.id);

        assert.equal(removeClientDaoStub.calledWith(clientObj.id), true);
        removeClientDaoStub.reset();
        done();
    });

    it('should get clients using username', (done) => {
        let userObj : User = EntityStubs.createAnyUser();
        let removeClientDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().getClientsByUsername;

        var promise = clientService.getClientsByUsername(userObj.username);

        assert.equal(removeClientDaoStub.calledWith(userObj.username), true);
        removeClientDaoStub.reset();
        done();
    });

    it('should update client using client id', (done) => {
        let clientObj : Client = EntityStubs.createAnyClient();
        let updateClientByIdDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().updateClientById;

        var promise = clientService.updateClientById(clientObj.id, clientObj);

        assert.equal(updateClientByIdDaoStub.calledWith(clientObj.id, { name : clientObj.name, redirect_uris : clientObj.redirect_uris }), true);
        updateClientByIdDaoStub.reset();
        done();
    });

    it('should update client using client id for only update params', (done) => {
        let clientObj : Client = EntityStubs.createAnyClient();
        let updateClientByIdDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().updateClientById;

        var promise = clientService.updateClientById(clientObj.id,  { name : clientObj.name });

        assert.equal(updateClientByIdDaoStub.calledWith(clientObj.id, { name : clientObj.name }), true);
        updateClientByIdDaoStub.reset();
        done();
    });

    it('should reset client secret using id', (done) => {
        let clientObj : Client = EntityStubs.createAnyClient();
        let getClientByIdDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().getClientById;
        let updateClientByIdDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().updateClientById;
        getClientByIdDaoStub.returns(Q.resolve(clientObj));
        updateClientByIdDaoStub.returns(Q.resolve(clientObj));

        var promise = clientService.resetClientSecretById(clientObj.id);
        promise.then((data : Client) => { 
            try {
                assert.equal(data.username, clientObj.username);
                assert.equal(data.name, clientObj.name);
                assert.equal(data.clientId, clientObj.clientId);
                assert.equal(data.clientSecret, clientObj.clientSecret);
                done();
            } catch(e) { done(e); }
        }).fail((err : Error) => { try { assert.equal(false, true, err.message); done();  } catch(e) { done(e); } });
        updateClientByIdDaoStub.reset();
    });

    it('should get client using key and secret', (done) => {
        let clientObj : Client = EntityStubs.createAnyClient();
        let updateClientByIdDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().getClientByClientIdAndSecret;

        var promise = clientService.getClientByClientIdAndClientSecret(clientObj.clientId, clientObj.clientSecret);

        assert.equal(updateClientByIdDaoStub.calledWith(clientObj.clientId, clientObj.clientSecret), true);
        updateClientByIdDaoStub.reset();
        done();
    });

    it('should get client using client id', (done) => {
        let clientObj : Client = EntityStubs.createAnyClient();
        let updateClientByIdDaoStub : sinon.SinonStub = <any>daoFactory.getClientDao().getClientByClientId;

        var promise = clientService.getClientByClientId(clientObj.clientId);

        assert.equal(updateClientByIdDaoStub.calledWith(clientObj.clientId), true);
        updateClientByIdDaoStub.reset();
        done();
    });
});