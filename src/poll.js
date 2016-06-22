const getRegistration = require('./util/get-registration');
const config = require('./config');

const pollRequest = function(endpoint, method = 'GET', body = '') {

    if (!config.poll || !config.poll.key || !config.poll.host) {
        throw new Error("Must set poll key and host");
    }

    return fetch(config.poll.host + endpoint, {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'x-polls-api-key': config.poll.key
        },
        body: JSON.stringify(body)
    });
};

module.exports = {
    castVote: function ({pollId, answerId}) {
        getRegistration().pushManager.getSubscription().then((subscription) => {
            return pollRequest('/polls/' + pollId + '/vote', 'POST', {
                answerId: answerId,
                user: {
                    id: subscription.endpoint,
                    subscription: subscription
                }
            });
        });
    },
    pollResults: function({pollId}) {
        getRegistration().pushManager.getSubscription().then((subscription) => {
            return pollRequest('/polls/' + pollId + '/results', 'POST', {
                user: {
                    id: subscription.endpoint,
                    subscription: subscription
                }
            })
        });
    }
};