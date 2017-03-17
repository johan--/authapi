import { browser, element, by } from 'protractor';
import { DBUtility } from "./utility/dbUtility";
import { User } from "../../../src/model/entity/user";
import { Client } from "../../../src/model/entity/client";

let api_baser_url : string = 'https://api-uat.taylorandfrancis.com/';
let profile : any = {
	          username: "api_database_integration_test_user_state_object" + getRandomInteger(1000, 9999) + "@integtest.tnf",
	          password: "Password1!",
	          userType: "librarian",
	          email: "api_database_integration_test_user_state_object@integtest.tnf",
	          firstName: "e2e_integration",
	          lastName: "user"
        }; 

let clientDetails : any = {
	          username: profile.username,
	          appName: "Integration testing",
	          redirectURL: "http://localhost.taylorandfrancis.com:4762/nonExistantURL/Callback"
        }; 

let clientObj : any = {};
let api_test_url : string = '/v2/auth/user/auth/authorize?response_type=code&client_id={{CLIENT_ID}}&state={{STATE}}&scope=mail openid profile&redirect_uri=' + clientDetails.redirectURL;
let api_test_url_tmp : string = '';

const dbUtil: DBUtility = new DBUtility();

function waitForUrlToChange(enteredUrl :any ) {
   return function () {
       return browser.getCurrentUrl().then(function (url) {
           return url.indexOf(enteredUrl) > -1;
       });
   };
};

function currenturl(callback : Function) {
    browser.getCurrentUrl().then(function(actualUrl) {
        callback(actualUrl);
    });
};

function getRandomInteger(min : number, max : number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

describe('State object check', () => {

    beforeEach((done : any) => {
        browser.baseUrl = api_baser_url;
            dbUtil.createUser(profile)
            .then(() => {
                console.log('user created');
                return dbUtil.createClient(clientDetails);
            })
            .then((client : Client) => {
                console.log('client created');
                api_test_url = api_test_url.replace("{{CLIENT_ID}}", <string>client.clientId);
                done();
            })
            .fail((err : Error) => { done(err); }).done();
    });

    afterEach((done : any) => {
        dbUtil.RemoveAuthorizeSuiteRecords(profile.username)
        .then(() => { return dbUtil.removeClient(profile.username); })
        .then(() => {
            console.log("Removing records from db is successfully done - state suite");
            done();
        })
        .fail((err : Error) => { 
            console.log("Removing records from db is unsuccessful - state suite");
            done(err); 
        });
    });

    it('should redirect to nonExistantURL page after login and state object should be returned', (done : any) => {
        api_test_url_tmp = api_test_url.replace("{{STATE}}", "stateobjvalue");
        browser.get(encodeURI(api_test_url_tmp));

        currenturl((url : string) => {
            if(url.indexOf('identity') > -1) {
                let subject = browser.getTitle();
                let result  = 'Taylor & Francis Group';
                //expect(subject).toEqual(result);    

                element(by.id('inputEmail')).sendKeys(profile.username);
                element(by.id('inputPassword')).sendKeys(profile.password);
                element(by.id('loginBtn')).click();             
            }
            
            browser.wait(waitForUrlToChange('nonExistantURL'), 5000);
            //expect(browser.getCurrentUrl()).toContain('nonExistantURL');
            //expect(browser.getCurrentUrl()).toContain('state=stateobjvalue');
        });
    
        api_test_url_tmp = api_test_url.replace("{{STATE}}", "stateobjvaluesecond");
        browser.get(encodeURI(api_test_url_tmp));

        browser.wait(waitForUrlToChange('nonExistantURL'), 5000);
        //expect(browser.getCurrentUrl()).toContain('nonExistantURL');
        //expect(browser.getCurrentUrl()).toContain('state=stateobjvaluesecond');
        done();
    });
});