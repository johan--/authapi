var env = process.env.NODE_ENV || 'dev'
  , cfg = require('../config/config.'+env);

console.log("Configurations-----"+JSON.stringify(cfg));
module.exports = cfg;