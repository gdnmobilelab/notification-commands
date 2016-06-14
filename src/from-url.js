const run = require('./run-command');
const commandSequence = require('./command-sequence');

module.exports = function ({url, fetchOpts}) {
    return fetch(url, fetchOpts)
    .then((res) => res.json())
    .then((json) => {
        return commandSequence({
            sequence: json
        })
    })
}