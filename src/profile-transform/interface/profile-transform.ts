'use strict'
import { User } from "../../model/entity/user";

export interface IProfileTransform{
    createUserFromProfile(profile: any): User;
}