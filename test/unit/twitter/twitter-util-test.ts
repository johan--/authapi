import { expect } from 'chai';
let TwitterUtil = require('../../../src/twitter/twitter-util');

describe("Twitter util",function(){

    it("should return user profile based on twitter profile passed as arguement",function(){
        let twitterProfile:any={
            id : "twitterID123",
            first_name : "userFirstName",
            last_name : "userLastName",
            email : "twitterUser@gmail.com"
        }
        expect(TwitterUtil.createUserFromTwitterProfile(twitterProfile)).to.be.equal(twitterProfile)
    });
});