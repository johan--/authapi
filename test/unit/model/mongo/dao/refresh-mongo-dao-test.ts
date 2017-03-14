var expect = require("chai").expect;
import RefreshDao = require("../../../../../src/model/mongo/dao/refresh-dao-mongo");
import mongoose = require("mongoose");
import refreshSchema = require("../../../../../src/model/mongo/schema/refresh-schema");
import IRefresh = require("../../../../../src/model/entity/refresh-token");
import ApplicationConfig = require("../../../../../src/config/application-config");
var dbConnection=require("./dbConnection");
dbConnection.on('connected', function () {  
  console.log('Mongoose default connection open ');
}); 

let refreshModel = mongoose.model("Refresh", refreshSchema);

function createMultipleRefreshs(refreshsToCreate: Array<IRefresh>,
  createdRefreshs: Array<IRefresh>,
  callback: (err: any) => void): void {

  let refreshToCreate: IRefresh = refreshsToCreate[0];
  refreshModel.create(refreshToCreate, function (err: any, createdRefresh: IRefresh) {
    if (err) {
      throw err
    }
    else if (createdRefresh) {
      if (refreshsToCreate.length > 1) {
        refreshsToCreate.shift();
        createdRefreshs.push(createdRefresh);
        createMultipleRefreshs(refreshsToCreate, createdRefreshs, callback);
      } else if (refreshsToCreate.length == 1) {
        createdRefreshs.push(createdRefresh);
        callback(null);
      }
    }

  });
}

function createAnyRefresh() {
    var uniqueNumber = Math.floor(Math.random() * (100 - 0) + 0);
    if (uniqueNumber < 10)
        uniqueNumber = uniqueNumber + 10;
    return {
        user: "userinaces"+uniqueNumber,
        client: "itisclient"+uniqueNumber,
        scope: ["scope1", "scope2"],
        code: "itiscode"+uniqueNumber,
        redirectUri: "redirectUri@"+uniqueNumber,
        responseType: "resType"+uniqueNumber,
        status: "status"+uniqueNumber,
    }
}
