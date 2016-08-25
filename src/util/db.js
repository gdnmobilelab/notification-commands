const treo = require('treo');
const treoPromise = require('treo/plugins/treo-promise');

const schema = treo.schema()
    .version(1)
        .addStore("notificationChains", {key: "id", increment: true})
        .addIndex("byChain", "chain")
    .version(2)
        .addStore("quizAnswers", {key: ["questionId", "quizId"]})
        .addIndex("byQuiz", "quizId");
        
const db = treo('notification-commands', schema)
    .use(treoPromise());

module.exports = db;
