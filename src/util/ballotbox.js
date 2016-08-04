const config = require('../config');

const ballotRequest = function(api) {
    return function(endpoint, method = 'GET', body = '') {

        if (!config.ballot || !config.ballot.key || !config.ballot.host) {
            throw new Error("Must set poll key and host");
        }

        return fetch(config.ballot.host + api + endpoint, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                'X-Ballot-API-Key': config.ballot.key
            },
            body: JSON.stringify(body)
        });
    }
};

module.exports = {
    pollRequest: ballotRequest('/polls'),
    quizRequest: ballotRequest('/quizzes')
};