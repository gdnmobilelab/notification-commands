
const customOperations = {
    randomBool: function() {
        return Math.random() >= 0.5
    }
}

module.exports = {
    set: function(opts, event, context) {
        if (!context) {
            throw new Error("Tried to set context when one does not exist");
        }

        let commandRegex = /\{\{(.*)\}\}/

        for (let key in opts.context) {
            let value = opts.context[key];
            
            if (typeof value !== "string") {
                continue;
            }

            let regexResult = commandRegex.exec(value);

            if (!regexResult || ! customOperations[regexResult[1]]) {
                continue;
            }
            let newValue = customOperations[regexResult[1]]();
            console.info(`Operation ${regexResult[1]} called for ${key}, new value is ${newValue}`)
            opts.context[key] = newValue;
        }

        Object.assign(context, opts.context);
    }
}