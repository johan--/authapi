import bodyParser = require("body-parser");
import express = require("express");
import path = require("path");

let fs = require('fs');
let swaggerJSDoc = require('swagger-jsdoc');

let auth = path.join(__dirname,'../routes/auth-router.js');
let client = path.join(__dirname,'../routes/client-router.js');
let user = path.join(__dirname,'../routes/user-router.js');
let definitions = path.join(__dirname,'../swagger/definitions.yaml');
//swagger specifications
let swaggerDefinition = {
	info: { 
	  // API informations (required)
	  title: 'Auth-User API', 
	  version: '1.0.0', 
	  description: 'Auth API', // Description (optional)
	},		 
    basePath: '/auth', // Base path (optional)
};
// Options for the swagger docs
let options = {	
	swaggerDefinition: swaggerDefinition,	
	apis: [auth,client,user,definitions],
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
let swaggerSpec = swaggerJSDoc(options);
let swaggerSpecjson = JSON.stringify(swaggerSpec);

//writing produced swaggerSpecjson to a file to serve it to swagger-ui
fs.writeFile('./dist/src/swagger/swagger.json',swaggerSpecjson,'utf8');