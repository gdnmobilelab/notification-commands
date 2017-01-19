const analytics = require('google-analytics-protocol');

module.exports = function (opts, context) {
  
    if (context && context.analyticsData) {
    	// Letting context override props
        opts = Object.assign({}, opts, context.analyticsData);
    }
    
    analytics(opts);
}