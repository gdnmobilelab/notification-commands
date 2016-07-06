const pushy = require('./pushy');
const chains = require('./chains');
const notification = require('./notification');
const commandSequence = require('./command-sequence');
const runCommand = require('./run-command');
const browser = require('./browser');
const poll = require('./poll');
const fromURL = require('./from-url');
const config = require('./config');
const cache = require('./cache');
const context = require('./context');

const commands = {
    pushy,
    chains,
    notification,
    commandSequence,
    browser,
    fromURL,
    cache,
    poll,
    context,
    update: () => self.registration.update()
};

runCommand.commands = commands;
notification.addListeners();

const registerWithBridge = function(bridge) {
    let namespaces = Object.keys(commands);
    
    namespaces.forEach((name) => {
        let commandObj = commands[name];
        
        if (typeof commandObj === "function") {
            bridge.bind(name, commandObj);
            return;
        }
        
        
        let functionNames = Object.keys(commandObj);
        
        functionNames.forEach((funcName) => {
            bridge.bind(name + '.' + funcName, commandObj[funcName]);
        })
        
    })
};

module.exports = {
    register: registerWithBridge,
    commands: commands,
    setConfig: config.update,
    run: runCommand
};
