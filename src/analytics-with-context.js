const analytics = require('google-analytics-protocol');

module.exports = function (opts, context) {
  
    if (context && context.analyticsData) {
        opts = Object.assign({}, context.analyticsData, opts);
    }
    
    analytics(opts);
}