const getRegistration = require('./util/get-registration');
const config = require('./config');
const ballotRequest = require('./util/ballotbox');
const pollRequest = ballotRequest.pollRequest;

module.exports = {
    castVote: function ({pollId, answerId}) {
        getRegistration().pushManager.getSubscription().then((subscription) => {
            return pollRequest('/' + pollId + '/vote', 'POST', {
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
            return pollRequest('/' + pollId + '/results', 'POST', {
                user: {
                    id: subscription.endpoint,
                    subscription: subscription
                }
            })
        });
    }
};