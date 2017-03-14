var expect = require("chai").expect;
import ConsentDao = require("../../../../../src/model/mongo/dao/consent-dao-mongo");
import mongoose = require("mongoose");
import consentSchema = require("../../../../../src/model/mongo/schema/consent-schema");
import IConsent = require("../../../../../src/model/entity/consent");
import ApplicationConfig = require("../../../../../src/config/application-config");
var dbConnection = require("./dbConnection");

dbConnection.on('connected', function () {
    console.log('Mongoose default connection open ');
});

let consentModel = mongoose.model("Consent", consentSchema);

function d2h(d: any) {
    return d.toString(16);
}

function stringToHex(tmp: String) {
    var str = '',
        i = 0,
        tmp_len = tmp.length,
        c: any;

    for (; i < tmp_len; i += 1) {
        c = tmp.charCodeAt(i);
        str += d2h(c);
    }
    return str;
}

function createMultipleConsents(consentsToCreate: Array<IConsent>,
    createdConsents: Array<IConsent>,
    callback: (err: any) => void): void {

    let consentToCreate: IConsent = consentsToCreate[0];
    consentModel.create(consentToCreate, function (err: any, createdConsent: IConsent) {
        if (err) {
            throw err
        }
        else if (createdConsent) {
            if (consentsToCreate.length > 1) {
                consentsToCreate.shift();
                createdConsents.push(createdConsent);
                createMultipleConsents(consentsToCreate, createdConsents, callback);
            } else if (consentsToCreate.length == 1) {
                createdConsents.push(createdConsent);
                callback(null);
            }
        }

    });
}

function createAnyConsent() {
    var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
    if (uniqueNumber < 10)
        uniqueNumber = uniqueNumber + 10;
    return {
        user: stringToHex("userinaces" + uniqueNumber),
        client: stringToHex("itisclient" + uniqueNumber),
        scopes: ["scope1", "scope2"],
    }
}


describe("ConsentCRUD\n", function () {
    beforeEach(function () {
        console.log("removing all users");
        consentModel.remove({}, function (error: any) {
            console.log("after removing all users : " + error);
        });

    });
    it("should create consent successfully", function (done :any){
        this.timeout(12000);
        let anyConsent: IConsent = createAnyConsent();
        new ConsentDao(dbConnection).createConsent(anyConsent, function (err: any, newConsent: IConsent) {
            expect(newConsent.user.toString()).to.equal(anyConsent.user);
            expect(newConsent.client.toString()).to.equal(anyConsent.client);
            done();
        });
    });

    it("should return consent on given criteria", function (done :any){
        let anyConsent1: IConsent = createAnyConsent();
        let anyConsent2: IConsent = createAnyConsent();
        let consentsToCreate: Array<IConsent> = [anyConsent1, anyConsent2];
        let createdConsents: Array<IConsent> = [];
        createMultipleConsents(consentsToCreate, createdConsents, function (err: any) {
            let consent1: IConsent = createdConsents[0];
            expect(createdConsents.length).to.be.equal(2);
            new ConsentDao(dbConnection).findConsent({ user: consent1.user }, function (err: any, newConsent: IConsent) {
                expect(newConsent.client.toString()).to.equal(consent1.client.toString());
                done();
            });
        });
    });

    it("should remove the consent on the given criteria", function (done :any){
        let anyConsent1: IConsent = createAnyConsent();
        let anyConsent2: IConsent = createAnyConsent();
        let consentsToCreate: Array<IConsent> = [anyConsent1, anyConsent2];
        let createdConsents: Array<IConsent> = [];
        createMultipleConsents(consentsToCreate, createdConsents, function (err: any) {
            let consent1: IConsent = createdConsents[0];
            expect(createdConsents.length).to.be.equal(2);
            new ConsentDao(dbConnection).removeConsent({ user: consent1.user }, function (err: any) {
                consentModel.count({}, function (err: any, count: number) {
                    expect(count).to.be.equal(1);
                    done();
                })
            });
        });
    })
});
