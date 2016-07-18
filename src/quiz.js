const getRegistration = require('./util/get-registration');
const ballotRequest = require('./util/ballotbox');
const quizRequest = ballotRequest.quizRequest;

function QuizStore() {
    var store = {};

    this.addAnswer = function(quizId, questionId, answerId) {
        var quizStore = store[quizId] || {};

        quizStore[questionId] = answerId;
        store[quizId] = quizStore;
    };

    this.getAnswers = function(quizId) {
        var quizStore = store[quizId] || {};
        var quizArray = [];

        for (var key in quizStore) {
            if (quizStore.hasOwnProperty(key)) {
                quizArray.push({questionId: key, answerId: quizStore[key]})
            }
        }

        return quizArray;
    }
}

var quizStore = new QuizStore();

module.exports = {
    answerQuestion: function({quizId, questionId, answerId}) {
        quizStore.addAnswer(quizId, questionId, answerId);
    },

    submitAnswers: function ({quizId}) {
        getRegistration().pushManager.getSubscription().then((subscription) => {
            return quizRequest('/' + quizId + '/submitAnswers', 'POST', {
                answers: quizStore.getAnswers(quizId),
                user: {
                    id: subscription.endpoint,
                    subscription: subscription
                }
            });
        });
    }
};