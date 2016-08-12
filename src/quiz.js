const getRegistration = require('./util/get-registration');
const ballotRequest = require('./util/ballotbox');
const quizRequest = ballotRequest.quizRequest;
const run = require('./run-command');
const db = require('./util/db');

const notificationStore = db.store("notificationChains");

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
    answerQuestion: function({quizId, questionId, answerId, correctAnswer, showNotification}) {
        quizStore.addAnswer(quizId, questionId, answerId, correctAnswer);

        return run("notification.show", showNotification);
    },

    submitAnswers: function ({quizId, chain}) {
        notificationStore
            .index("byChain")
            .get(chain)
            .then((chainItems) => {
                if (chainItems.length === 0) {
                    return console.error("No chain with the name: ", chain)
                }

                let correctAnswers = quizStore.getAnswers(quizId).filter((answer) => answer.correctAnswer);
                return run("notification.show", chainItems[correctAnswers.length]);
            });

        getRegistration().pushManager.getSubscription().then((subscription) => {
            return quizRequest('/' + quizId + '/submit', 'POST', {
                answers: quizStore.getAnswers(quizId),
                user: {
                    id: subscription.endpoint,
                    subscription: subscription
                }
            });
        }).catch((err) => {
            console.log(err);
        });
    }
};