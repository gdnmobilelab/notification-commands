const PromiseTools = require('promise-tools');
const run = require('./run-command');

module.exports = function ({sequence, event}) {
    let chainMappedToCommands = sequence.map(({command, options}) => {
        return () => run(command, options, event);
    })
    
    return PromiseTools.series(chainMappedToCommands);
};