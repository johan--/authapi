import mongoose = require("mongoose");
import ApplicationConfig = require("../../../../../src/config/application-config");


mongoose.connect(<string>ApplicationConfig.MONGO_DB_URL);
var dbConnection = mongoose.connection;
 dbConnection.once('open', function callback() {
   console.log('Connected To Mongo Database');
 });
export=dbConnection;