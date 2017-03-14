'use strict'

import ApplicationConfig = require("../config/application-config");
import winston = require('winston');
var path = require('path');
var fs = require('fs');

export class Logger {

    private logger : winston.LoggerInstance;

    /**
     * Creates an instance of Logger.
     * 
     * @param {string} fileName. 
     * 
     * @memberOf Logger
     */
    constructor(fileName : string) { 
        let filePath = path.join(__dirname, ApplicationConfig.LOGGER.filesPath);
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath);
        }

        this.logger = new (winston.Logger)({
            level: ApplicationConfig.LOGGER.logLevel,
            transports: [
                new (winston.transports.Console)({
                    label: fileName,
                    timestamp: true,
                    level: 'info'
                }),
                new (require('winston-daily-rotate-file'))({ 
                    label: fileName,
                    filename: filePath + ApplicationConfig.LOGGER.filename,
                    datePattern : '.yyyy-MM-dd',
                    json : ApplicationConfig.LOGGER.logJSONFormat,
                    handleExceptions: true
                })
            ],
            exitOnError: false,
        });
    }

    /**
     * Logs debugging messages
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    debug(message : string, data? : any) : void {
        this.logger.debug(message, data);
    } 

    /**
     * Logs exceptions
     * 
     * @param {string} message
     * @param {Error} [err]
     * 
     * @memberOf Logger
     */
    error(message : string, err? : Error) : void {
        this.logger.error(message, err);
    } 
}