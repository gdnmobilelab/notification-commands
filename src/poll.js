const getRegistration = require('./util/get-registration');


module.exports = {
    castVote: function ({url, answerId}) {
        getRegistration().pushManager.getSubscription().then((subscription) => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-type': 'application/json'
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
    }
};