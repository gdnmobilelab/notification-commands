const runCommand = function(name, opts, event) {
    let nameSplit = name.split('.');
    let currentTarget = runCommand.commands;
    
    nameSplit.forEach((name) => {
        currentTarget = currentTarget[name];
        if (!currentTarget) {
            throw new Error("Could not find target: " + name)
        }
    });
    return currentTarget(opts, event);
}

module.exports = runCommand;