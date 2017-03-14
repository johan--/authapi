'use strict'
import * as Q from "q";
import { Request} from "express";
import { DaoFactory } from "../../../model/dao/factory";
import { IClientDao } from "../../../model/dao/interface/client-dao";
import { IUserDao } from "../../../model/dao/interface/user-dao";
import { Client } from "../../../model/entity/client";
import { User } from "../../../model/entity/user";
//import { IClientService } from "../interface/client";
import { Logger } from '../../../util/logger';
import { Helper } from '../../../util/helper';
import { SessionManager, SessionKeys } from '../../../util/session';
import { ITokenManager } from '../../../token/interface/tokenmanager';

const log = new Logger('OIDCService');

export class OIDCService {


    
}