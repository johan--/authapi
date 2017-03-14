import IpDataTransformUtil = require("../../../src/ipData/ip-data-transform-util")
import IUser = require("../../../src/model/entity/user");
import TestUtil = require("../util/test-util");

let expect = require("chai").expect;
let util:TestUtil=new TestUtil();

describe("IpDataTransformUtil", function(){
    let ipWithOrgDetails : any = util.sendOrgDetails();
    console.log("ipWithOrgDetails : ", ipWithOrgDetails);

    let ipProfile :HTMLBodyElement= ipWithOrgDetails;
    console.log("ipProfile", ipProfile);
    it('it should create user with ipaddress and orgDetails ', function(){
        

    })
})