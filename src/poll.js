const getRegistration = require('./util/get-registration');
const config = require('./config');

module.exports = {
    castVote: function ({url, answerId}) {
        if (!config.poll || !config.poll.key) {
            throw new Error("Must set pull key");
        }
        
        getRegistration().pushManager.getSubscription().then((subscription) => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-type': 'application/json',
                    'x-polls-api-key': config.poll.key
                },
                body: JSON.stringify({
                    answerId: answerId,
                    user: {
                        id: subscription.endpoint,
                        subscription: subscription
                    }
                })
            });
        });
    },
    pullResults: function({url}) {
        if (!config.poll || !config.poll.key) {
            throw new Error("Must set pull key");
        }

        getRegistration().pushManager.getSubscription().then((subscription) => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-type': 'application/json',
                    'x-polls-api-key': config.poll.key
                },
                body: JSON.stringify({
                    user: {
                        id: subscription.endpoint,
                        subscription: subscription
                    }
                })
            });
        });
    }
};