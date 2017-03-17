var config: any = {};
config.SMTP_HOST = { host: 'usmia-mail.crcpress.local', port: '25', secure: false };
config.FROM_EMAIL = "noreply@taylorandfrancis.com";
config.MONGO_DB_URL = "mongodb://m0ng0u$er:m0ng0pa$$w0rd@ds021604-a0.mlab.com:21604,ds021604-a1.mlab.com:21604/user-test?replicaSet=rs-ds021604";
config.MONGO = {
    url: "mongodb://m0ng0u$er:m0ng0pa$$w0rd@ds021604-a0.mlab.com:21604,ds021604-a1.mlab.com:21604/user-test?replicaSet=rs-ds021604"
};
config.APPLICATION_PORT = 3000;
config.env = 'test';
config.WHITELISTED_DOMAIN = [".taylorandfrancis.com"];

let test_clientID = "APP-PT1ZDEH227AVL02Q";
let test_callbackURL = "http://localhost:3000/user/auth/orcid/callback";

config.ORCID = {
    apiUrl:"https://api.sandbox.orcid.org/v1.2/",
    tokenURL: "https://api.sandbox.orcid.org/oauth/token",
    clientID: test_clientID,
    clientSecret: "757c9416-e077-4708-9d84-789d38362b0a",
    callbackURL: test_callbackURL,
    authorizationURL: "https://sandbox.orcid.org/oauth/authorize?client_id=" + test_clientID + "&response_type=code&scope=/read-limited /activities/update&redirect_uri=" + test_callbackURL,
    tnfClientUrls: {
        "RESEARCHER_PORTAL_LOCAL": "http://localhost:9090/login/orcid/callback",
        "RESEARCHER_PORTAL_DEV": "http://research-portal-web-dev-1955697875.eu-west-1.elb.amazonaws.com/login/orcid/callback",
        "RESEARCHER_PORTAL_PROD": "https://rp.cogentoa.com/login/orcid/callback",
        "RESEARCHER_PORTAL_STAGE" : "http://research-portal-web-stage-2047067933.eu-west-1.elb.amazonaws.com/login/orcid/callback"
    }
}

config.FACEBOOK = {
    clientID: "1214350571940554",
    clientSecret: "7eafabae1d4a271e32068b3bef842254",
    callbackURL: "http://localhost:3000/user/auth/facebook/callback",
    profileFields: ['id', 'displayName', "bio", 'birthday', 'gender', 'email'
								, "first_name", "last_name", "middle_name", "hometown", "location", "work"],

}

config.TWITTER = {
    consumerKey: "DJzCYb5EO5IflIMVEjcHoOkyS",
    consumerSecret: "LOuIJodWgbnT2k4BULBsi5bBGPYdRU3oemInIFtYElqywlgUmV",
    callbackURL: "http://localhost:3000/user/auth/twitter/callback"

}

config.LINKEDIN = {
    consumerKey: "785phdife9kyjv",
    consumerSecret: "83RjifJ78LsY95qb",
    callbackURL: "http://localhost:3000/user/auth/linkedin/callback",
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']

}

config.GOOGLE = {
    clientID: "850832438542-iki983irl5sq17mc9kscrtjj808use65.apps.googleusercontent.com",
    clientSecret: "QADP5n0xrsdRkTVrT9HDqm_m",
    callbackURL: "http://localhost:3000/user/auth/google/callback"
}

//TO_DO Update the url for the ip management.
config.IPMGMT = {
    ipAuthApiUrl : 'http://localhost:32769/ipAuth'
}

config.REDIRECT = {
    login_url: 'http://localhost:3001/#/login?authorize=true',
    verify_url: 'http://localhost:3001/#/verify?authorize=true',
 	consent_url: 'https://api-test.taylorandfrancis.com/v2/auth/user/auth/consent',
    identity_ui_consent_url: 'http://localhost:3001/#/consent',
    this_api_base_url: 'https://api-test.taylorandfrancis.com/v2/auth',
    identity_ui_base_url: 'http://localhost:3001/'
}

module.exports = config;