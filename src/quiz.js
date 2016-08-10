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
    answerQuestion: function({quizId, questionId, answerId, answerBody, answerTitle, index, chain, nextText}, events, context) {
        quizStore.addAnswer(quizId, questionId, answerId);

        notificationStore
            .index("byChain")
            .get(chain)
            .then((chainItems) => {
                if (chainItems.length === 0) {
                    return console.error("No chain with the name: ", chain)
                }

                //Index is the next index, so get the previous notification
                let chainEntry = chainItems[(index || chainItems.length) - 1];

                let nextQuestion = {
                    "label": "web-link",
                    "commands": [
                        {
                            "command": "chains.notificationAtIndex",
                            "options": {
                                "chain": chain,
                                "index": index
                            }
                        }
                    ],
                    "template": {
                        "title": nextText
                    }
                };

                if (!index) {
                    nextQuestion.commands = [{
                        "command": "quiz.submitAnswers",
                        "options": {
                            "quizId": quizId
                        }
                    }];
                }

                return run("notification.show", {
                    title: answerTitle,
                    options: {
                        body: answerBody,
                        tag: chain,
                        icon: chainEntry.notificationTemplate.icon,
                        data: {
                            notificationID: chain
                        }
                    },
                    swapNotificationActions: Math.random() >= 0.5,
                    actionCommands: [nextQuestion]
                }, null, context)
            });
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
