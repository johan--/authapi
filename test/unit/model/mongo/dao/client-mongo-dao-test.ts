var expect = require("chai").expect;
import ClientDao = require("../../../../../src/model/mongo/dao/client-dao-mongo");
import mongoose = require("mongoose");
import clientSchema = require("../../../../../src/model/mongo/schema/client-schema");
import userSchema = require("../../../../../src/model/mongo/schema/user-schema");
import IClient = require("../../../../../src/model/entity/client");
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

let clientModel = mongoose.model("Client", clientSchema);

function createMultipleClients(clientsToCreate: Array<IClient>,
  createdClients: Array<Client>,
  callback: (err: any) => void): void {

  let clientToCreate: IClient = clientsToCreate[0];
  clientModel.create(clientToCreate, function (err: any, createdClient: IClient) {
    if (err) {
      throw err;
    }
    else if (createdClient) {
      if (clientsToCreate.length > 1) {
        clientsToCreate.shift();
        createdClients.push(createdClient);
        createMultipleClients(clientsToCreate, createdClients, callback);
      } else if (clientsToCreate.length == 1) {
        createdClients.push(createdClient);
        callback(null);
      }
    }

  });
}

function createAnyClient() {
  var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
  return {
    id: String("id" + uniqueNumber),
    name: "clientApp" + uniqueNumber,
    username: "username" + uniqueNumber,
    clientId: "clientId" + uniqueNumber,
    clientSecret: "clientSecret" + uniqueNumber,
    redirect_uris: ["www.app" + uniqueNumber + "1.com", "www.app" + uniqueNumber + "2.com"]
  }
}

describe('ClientCRUD\n', function () {

  beforeEach(function () {
    console.log("removing all users");
    clientModel.remove({}, function (error: any) {
      console.log("after removing all users : " + error);
    });

  });

  describe("addClient\n", function () {
    it("should create client successfully ", function (done :any){
      this.timeout(14000);
      let anyClient: IClient = createAnyClient();
      new ClientDao(dbConnection).addClient(anyClient, function (err: any, clientCreated: IClient) {
        clientModel.create(anyClient, function (err: any, clientNewCreated: IClient) {
          expect(anyClient.id).to.have.length.above(0);
          expect(anyClient.name).to.equal(clientNewCreated.name);
          done();
        })
      });
    });
  });

  describe("getClientByClientId\n", function () {

    it("should return a client if there is existing client with given client id", function (done :any){
      let anyClient1: IClient = createAnyClient();
      let anyClient2: IClient = createAnyClient();
      let ClientsToCreate: Array<IClient> = [anyClient1, anyClient2];
      let createdClients: Array<IClient> = [];
      createMultipleClients(ClientsToCreate, createdClients, function (err) {
        expect(createdClients.length).to.equal(2);
        let Client1: IClient = createdClients[0];
        new ClientDao(dbConnection).getClientByClientId(Client1.clientId, function (err: any, ClientById: IClient) {
          if (err) throw err;
          expect(ClientById.id).to.equal(Client1.id);
          expect(ClientById.name).to.equal(Client1.name);
          done();
        });
      });
    });

    it("should return null if there  is no client with given client id", function (done :any){
      let clientId: String = "123";
      let anyClient1: IClient = createAnyClient();
      let anyClient2: IClient = createAnyClient();
      let ClientsToCreate: Array<IClient> = [anyClient1, anyClient2];
      let createdClients: Array<IClient> = [];
      createMultipleClients(ClientsToCreate, createdClients, function (err) {
        expect(createdClients.length).to.equal(2);
        let Client1: IClient = createdClients[0];
        new ClientDao(dbConnection).getClientByClientId(clientId, function (err: any, ClientById: IClient) {
          expect(ClientById).to.be.null;
          done();
        });
      });
    });

  });


  describe("updateClientById\n", function () {
    it('should update client if there is existing client with given client id ', function (done :any){
      let anyClient1: IClient = createAnyClient();
      let anyClient2: IClient = createAnyClient();
      let ClientsToCreate: Array<IClient> = [anyClient1, anyClient2];
      let createdClients: Array<IClient> = [];
      createMultipleClients(ClientsToCreate, createdClients, function (err) {
        expect(createdClients.length).to.equal(2);
        let Client1: IClient = createdClients[0];
        new ClientDao(dbConnection).updateClientById(Client1.id, { name: "anyAppName" }, function (err: any, updatedClient: IClient) {
          expect(updatedClient.id).to.equal(Client1.id);
          expect(updatedClient.name).to.equal("anyAppName");
          expect(updatedClient).to.equal.true;
          done();
        });
      });
    });

    it('should return error on updating client with id which does not exist', function (done :any){
      let anyClient1: IClient = createAnyClient();
      let anyClient2: IClient = createAnyClient();
      let ClientsToCreate: Array<IClient> = [anyClient1, anyClient2];
      let createdClients: Array<IClient> = [];
      createMultipleClients(ClientsToCreate, createdClients, function (err) {
        let Client1: IClient = createdClients[0];
        let id: String = "123";
        new ClientDao(dbConnection).updateClientById(id, { name: "anyAppName" }, function (err: any, updatedClient: IClient) {
          expect(updatedClient).to.be.null;
          done();
        });
      });
    });
  });

  describe("getClientsByUsername\n", function () {
    it('should return all clients for given username', function (done :any){
      let anyClient1: IClient = createAnyClient();
      let anyClient2: IClient = createAnyClient();
      let anyClient3: IClient = createAnyClient();
      let ClientsToCreate: Array<IClient> = [anyClient1, anyClient2, anyClient3];
      let createdClients: Array<IClient> = [];
      createMultipleClients(ClientsToCreate, createdClients, function (err) {
        expect(createdClients.length).to.equal(3);
        let Client1: IClient = createdClients[0];
        let Client2: IClient = createdClients[0];
        let Client3: IClient = createdClients[1];
        new ClientDao(dbConnection).getClientsByUsername(Client1.username, function (err: any, createdClients: Array<IClient>) {
          expect(createdClients[0].username).to.equal(Client1.username);
          expect(createdClients[0].username).to.equal(Client2.username);
          expect(createdClients[0].username).to.not.equal(Client3.username);
          done();
        });
      });
    });
  });

  describe("getClientByClientIdAndSecret\n", function () {
    it('should return a client if there is existing client with given clientid and clientSecret', function (done :any){
      let anyClient1: IClient = createAnyClient();
      let anyClient2: IClient = createAnyClient();
      let ClientsToCreate: Array<IClient> = [anyClient1, anyClient2];
      let createdClients: Array<IClient> = [];
      createMultipleClients(ClientsToCreate, createdClients, function (err) {
        expect(createdClients.length).to.equal(2);
        let Client1: IClient = createdClients[0];
        clientModel.count({}, function (err, count) {
          console.log("Number of users:", count);
        });
        new ClientDao(dbConnection).getClientByClientIdAndSecret(Client1.clientId, Client1.clientSecret, function (err: any, ClientBySecret: IClient) {
          expect(ClientBySecret.id).to.equal(Client1.id);
          expect(ClientBySecret.name).to.equal(Client1.name);
          done();
        });
      });
    });
  });

 /* describe("getClient\n", function () {
    it("should return a client with given criteria", function (done :any){
      let anyClient1: IClient = createAnyClient();
      let anyClient2: IClient = createAnyClient();
      let ClientsToCreate: Array<IClient> = [anyClient1, anyClient2];
      let createdClients: Array<IClient> = [];
      createMultipleClients(ClientsToCreate, createdClients, function (err) {
        expect(createdClients.length).to.equal(2);
        let Client1: IClient = createdClients[0];
        new ClientDao(dbConnection).getClient({ clientId: Client1.clientId }, function (err: any, ClientBySecret: IClient) {
          if (err) throw err;
          expect(ClientBySecret.id).to.equal(Client1.id);
          expect(ClientBySecret.name).to.equal(Client1.name);
          expect(ClientBySecret).to.equal.true;
          done();
        });
      });
    });
  });*/
});