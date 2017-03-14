//Commenting out this test case since librarian page is unauthorized because of ip permission
//once ip is configured will enable the test case
//Authorization flow is taken care in another test case file i.e state-object-return.e2e.ts

/*'use strict';
import { browser, element, by } from 'protractor';
import { DBUtility } from "./utility/dbUtility";
import IUser = require("../../../src/model/entity/user");

let api_baser_url : string = 'https://api-uat.taylorandfrancis.com/';
let profile : any = {
            username: "api_database_integration_test_user_authorize@integtest.tnf",
            password: "Password1!",
            userType: "librarian",
            email: "api_database_integration_test_user_authorize@integtest.tnf",
            firstName: "e2e_integration",
            lastName: "user"
        }; 

const dbUtil: DBUtility = new DBUtility();


function waitForUrlToChange(enteredUrl :any ) {
   return function () {
       return browser.getCurrentUrl().then(function (url) {
           return url.indexOf(enteredUrl) > -1;
       });
   };
};

describe('Librarian authorize', () => {
    beforeEach((done : any) => {
        browser.get('/librarian/');

        dbUtil.createUser(profile)
        .then((user : IUser) => {
            console.log('user created');
            done();
        })
        .fail((err : Error) => { done(err); }).done();        
    });

    afterEach((done : any) => {
        dbUtil.RemoveAuthorizeSuiteRecords(profile.username)
        .then(() => {
            console.log("Removing records from db is successfully done");
            done();
        })
        .fail((err : Error) => { 
            console.log("Removing records from db is unsuccessful");
            done(err); 
        }).done();
    });

    it('should redirect to librarian page after login ', (done : any) => {
        let subject = browser.getTitle();
        let result  = 'Taylor & Francis Group';
        expect(subject).toEqual(result);

        element(by.id('inputEmail')).sendKeys(profile.username);
        element(by.id('inputPassword')).sendKeys(profile.password);
        element(by.id('loginBtn')).click();
        browser.wait(waitForUrlToChange('librarian'), 5000);
        expect(browser.getCurrentUrl()).toContain('librarian');

        done();
    });
});*/