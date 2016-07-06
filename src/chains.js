const PromiseTools = require('promise-tools');
const db = require('./util/db');
const run = require('./run-command');

const notificationStore = db.store("notificationChains");

const getNextNotificationForChain = function(chain, skipID) {
    return notificationStore
            .index("byChain")
            .get(chain)
        .then((chainItems) => {
            return chainItems
                .filter((i) => i.read !== true && (!skipID || i.id !== skipID))
                .sort((a,b) => a.idx - b.idx)
                [0]
        })
}

const chains = {
    download: function(opts) {
        return fetch(opts.url)
        .then((res) => res.json())
        .then((json) => {
            return PromiseTools.map(json, (chain) => {
                return chains.store(chain)
            })
        })
    },
    delete: function(chain) {
        return notificationStore
            .index("byChain")
            .get(chain)
        .then((chainItems) => {
            return PromiseTools.map(chainItems, (item) => notificationStore.del(item.id));
        })
    },
    store: function({chain, values}) {
        return chains.delete(chain)
        .then(() => {
            
            values.forEach((obj, idx) => {
                // Add chain and index properties to our entry,
                // for future search and sort
                obj.chain = chain;
                obj.index = idx;
            })
            return PromiseTools.map(values, (value) => {
                return notificationStore.put(value);
            })
        })
    },
    notificationAtIndex: function(opts) {
        return notificationStore
            .index("byChain")
            .get(opts.chain)
        .then((chainItems) => {
            if (chainItems.length === 0) {
                return console.error("No chain with the name: ", opts.chain)
            }
            let chainEntry = chainItems[opts.index];
            if (!chainEntry) {
                return console.error("No notification at index #", opts.index);
            }
            return run("notification.show", {
                title: chainEntry.title,
                options: chainEntry.notificationTemplate,
                actionCommands: chainEntry.actions
            });
        })
    },
    notificationFromChain: function(opts) {
        return getNextNotificationForChain(opts.chain)
        .then((chainEntry) => {
            
            // chain notifications need to follow a specific format
            
            let sameChainCommand = chainEntry.actions.find((c) => c.label === "sameChain");
            let switchChainCommand = chainEntry.actions.find((c) => c.label === "switchChain");
            let linkCommands = chainEntry.actions.filter((c) => c.label === "web-link");
            
            // now we have our commands we need to check whether either of those
            // chains still have entries in them.
            
            return PromiseTools.parallel([
                function() {
                    
                    // sometimes we don't actually have a same chain command - e.g. if we
                    // know it is the end of the chain.
                    
                    if (!sameChainCommand) return null;
                    
                    return getNextNotificationForChain(opts.chain, chainEntry.id)
                },
                function() {
                    if (!switchChainCommand) return null;
                    
                    return getNextNotificationForChain(switchChainCommand.switchTo)
                }
            ])
            .then(([sameChainNext, switchedChainNext]) => {
                let actions = [];
                
                // now we know which commands we can actually use. If they have
                // at least one item in the array, we'll use them. 
                
                if (sameChainNext) {
                    actions.push(sameChainCommand);
                }
                if (switchedChainNext) {
                    if (chainEntry.actions.indexOf(sameChainCommand) > chainEntry.actions.indexOf(switchChainCommand)) {
                        actions.unshift(switchChainCommand);
                    } else {
                        actions.push(switchChainCommand);
                    }
                    
                }
                
                if (actions.length === 0) {
                    // If neither have any items left, we show the article link.
                    if (linkCommands[0]) {
                        actions.push(linkCommands[0]);
                    }
                    
                    if (linkCommands[1]) {
                        actions.push(linkCommands[1]);
                    }
                }
                
                
                
                chainEntry.read = true;
                
                return notificationStore.put(chainEntry)
                .then(() => {
                    return run("notification.show", {
                        title: chainEntry.title,
                        options: chainEntry.notificationTemplate,
                        actionCommands: actions
                    });
                })
                
            })
            
            
            

        })

    }
}
    
module.exports = chains;