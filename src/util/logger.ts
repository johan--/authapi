'use strict'

import ApplicationConfig = require("../config/application-config");
import winston = require('winston');
import * as log4js from "log4js";
var path = require('path');
var fs = require('fs');

export class Logger {

    private logger : log4js.Logger;

    /**
     * Creates an instance of Logger.
     * 
     * @param {string} fileName. 
     * 
     * @memberOf Logger
     */
    constructor(fileName : string) { 
        /*let filePath = path.join(__dirname, ApplicationConfig.LOGGER.filesPath);
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath);
        }

        this.logger = new (winston.Logger)({
            level: ApplicationConfig.LOGGER.logLevel,
            transports: [
                new (winston.transports.Console)({
                    label: fileName,
                    handleExceptions: true
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
        });*/

        /**
         * make a log directory, just in case it isn't there.
         */
        try {
            if (!fs.existsSync(ApplicationConfig.LOG_PATH)){
                fs.mkdirSync(ApplicationConfig.LOG_PATH);
                fs.mkdirSync(ApplicationConfig.APP_LOG_PATH);
            } else if (!fs.existsSync(ApplicationConfig.APP_LOG_PATH)) {
                fs.mkdirSync(ApplicationConfig.APP_LOG_PATH);
            }
        } catch (e) {
            if (e.code != 'EEXIST') {
                console.error("Could not set up log directory, error was: ", e);
                process.exit(1);
            }
        }

        this.logger = log4js.getLogger(fileName);
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
        this.logger.debug(message, data === undefined ? "" : data);
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
        this.logger.error(message, err === undefined ? "" : err);
    } 
}