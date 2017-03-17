exports.config = {
	baseUrl: 'https://beta-uat.taylorandfrancis.com/',
	
	specs: [
		'dist/test/integration/protractor/*.e2e.js'
	],
	exclude: [],

	framework: 'jasmine2',

	allScriptsTimeout: 110000,

	jasmineNodeOpts: {
		showTiming: true,
		showColors: true,
		isVerbose: false,
		includeStackTrace: false,
		defaultTimeoutInterval: 400000
	},
	directConnect: true,

	onPrepare: function() {
		browser.ignoreSynchronization = true;
	}
};
