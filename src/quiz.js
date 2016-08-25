const getRegistration = require('./util/get-registration');
const ballotRequest = require('./util/ballotbox');
const quizRequest = ballotRequest.quizRequest;
const run = require('./run-command');
const db = require('./util/db');

const quizAnswers = db.store("quizAnswers");
const notificationStore = db.store("notificationChains");

function QuizStore() {

    this.addAnswer = function(quizId, questionId, answerId, correctAnswer) {
        quizAnswers.put({
            "answerId": answerId,
            "questionId": questionId,
            "quizId": quizId,
            "correctAnswer": correctAnswer
        });
    };

    this.getAnswers = function(quizId) {
        return quizAnswers
            .index("byQuiz")
            .get(quizId);
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

                quizStore.getAnswers(quizId).then((answers) => {
                    let correctAnswers = answers.filter((a) => a.correctAnswer);

                    run("notification.show", chainItems[correctAnswers.length]);

                    getRegistration().pushManager.getSubscription().then((subscription) => {
                        return quizRequest('/' + quizId + '/submit', 'POST', {
                            answers: answers,
                            user: {
                                id: subscription.endpoint,
                                subscription: subscription
                            }
                        });
                    }).catch((err) => {
                        console.log(err);
                    });
                })
            });
    }
};