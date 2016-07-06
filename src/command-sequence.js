const PromiseTools = require('promise-tools');
const run = require('./run-command');

module.exports = function ({sequence, event, context = {}}) {
    let chainMappedToCommands = sequence.map(({command, options}) => {
        return () => run(command, options, event, context);
    })
    
    return PromiseTools.series(chainMappedToCommands);
};