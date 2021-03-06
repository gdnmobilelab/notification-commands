const getRegistration = require('./util/get-registration');
const analytics = require('./analytics-with-context');
const run = require('./run-command');

const mapActionsToNotification = function(notification, actions) {
    
    /*
        We can't store data against notification actions themselves, all
        we can do is store a string. So instead we store our command data
        in the data attribute of the notification itself, and just set a
        index property on the 'action' property. Later, when processing 
        a notification click, we read that data back out again.
    */
    
    notification.actions = notification.actions || [];
    notification.data = notification.data || {};
    notification.data.commandSequences = [];
    notification.data.commandToActionLabelMap = [];
    
    actions.forEach((action) => {
        
        notification.data.commandSequences.push(action.commands);
        let commandString = "__command::" + String(notification.data.commandSequences.length - 1);

        notification.actions.push(Object.assign(action.template, {
            action: commandString
        }));
        
        // We use this in analytics to track which button was actually pressed
        //Use actionID to uniquely identify the action
        notification.data.commandToActionLabelMap.push(action.template.title + (action.actionID ? '-' + action.actionID : ''));
    })
};

const getNotificationID = function(baseObj) {
    
    let backupTitle = baseObj.title;

    // This is messy because we're dealing with different source objects.
    
    if (baseObj && baseObj.options) {
        baseObj = baseObj.options;
    }

    
    if (!baseObj || !baseObj.data || !baseObj.data.notificationID) {
        if (backupTitle) {
            console.warn("Notification does not have ID, using title")
            return backupTitle
        } else {
            console.error("Notification does not have an ID.")
            return null;
        }
        
    }
    return baseObj.data.notificationID;
}

const notification = {
    show: function(opts, event, context) {
        if (opts.actionCommands) {
            mapActionsToNotification(opts.options, opts.actionCommands);
        }

        let {swapNotificationActions} = opts;

        if (context && opts.options) {
            // We can pass context through notifications
            opts.options.data = opts.options.data || {};
            opts.options.data.context = context;
            if (swapNotificationActions !== true && swapNotificationActions !== false) {
                swapNotificationActions = context.swapNotificationActions
            }
            
        }

        if (swapNotificationActions === true && opts.options && opts.options.actions.length > 1) {
            let newFirstAction = opts.options.actions[1];
            let newSecondAction = opts.options.actions[0];

            opts.options.actions = [
                newFirstAction,
                newSecondAction
            ]
        }

        

        let notificationID = getNotificationID(opts);
        
        return getRegistration().showNotification(opts.title, opts.options)
        .then(() => {
            analytics({
                t: 'event',
                ec: 'Notification',
                ea: 'show',
                el: opts.title,
                // This requires you to have a custom dimension set up to record notification IDs
                cd1: notificationID
            }, context)
        })
    },
    close: function(opts, event) {
        debugger;
        if (opts && opts.tag) {
            return getRegistration().getNotifications({tag: opts.tag})
            .then((notifications) => {
                notifications.forEach((n) => n.close());
            })
        } else if (event) {
            event.notification.close();
        }
        
        return Promise.resolve();
    },
    parseNotificationAction: function(event) {
        event.waitUntil(
            Promise.resolve()
            .then(() => {
                let context = event.notification.data ? event.notification.data.context : null;
                if (event.action === '' && event.notification.data && event.notification.data.onTap) {
                    return run("commandSequence", {
                        sequence: event.notification.data.onTap,
                        event: event,
                        context: context
                    })
                    .then(() => {
                        analytics({
                            t: 'event',
                            ec: 'Notification',
                            ea: 'tap',
                            el: event.notification.title,
                            cd1: getNotificationID(event.notification)
                        }, context)
                    })
                    .catch((err) => {
                        console.error(err)
                    })
                    
                }
            
            
                if (event.action && event.action.indexOf('__command') === 0) {
                    // it's an action mapped to a command sequence.

                    let sequenceIndex = parseInt(event.action.split("::")[1], 10);
                    let commandSequence = event.notification.data.commandSequences[sequenceIndex];
                    let actionLabel = event.notification.data.commandToActionLabelMap[sequenceIndex];
                    
                    return run("commandSequence", {
                        sequence: commandSequence,
                        event: event,
                        context: context
                    }).then(() => {
                        analytics({
                            t: 'event',
                            ec: 'Notification',
                            ea: 'tap-action',
                            el: actionLabel,
                            cd1: getNotificationID(event.notification)
                        }, context)
                    })
                    .catch((err) => {
                        console.error(err)
                    })
                }

                
            })
            .catch((err) => {
                console.error(err.message);
            })
        )
    },
    parseNotificationClose(event) {
        
        analytics({
            t: 'event',
            ec: 'Notification',
            ea: 'close',
            el: event.notification.title,
            cd1: getNotificationID(event.notification)
        })
        
        if (!event.notification.data || !event.notification.data.onClose) {
            return;
        }
        return event.waitUntil(
            run("commandSequence", {
                sequence: event.notification.data.onClose,
                event: event
            })
        );
    },
    receivePush(event) {
      
        let obj = event.data.json();
        
        console.log(obj.data)
        if (obj.data && obj.data.payload) {
            // For Firebase notifications
            obj = JSON.parse(obj.data.payload)
        }

        console.log("received push", obj);

        if (obj instanceof Array) {
            event.waitUntil(
                run("commandSequence", {
                    sequence: obj
                })
            );
            analytics({
                t: 'event',
                ec: 'Push',
                ea: 'received'
            });
        } else {
            event.waitUntil(
                run("commandSequence", {
                    sequence: obj.commands
                })
            );
            analytics({
                t: 'event',
                ec: 'Push',
                ea: 'received',
                el: obj.pushId
            });
        }
        
        
        
    },

    getAll: function(opts) {
        return getRegistration().getNotifications(opts)
        .then((notifications) => {
            // make them JSON serialisable

            return notifications.map((n) => {
                return {
                    tag: n.tag,
                    title: n.title,
                    body: n.body,
                    data: n.data,
                    actions: n.actions
                }
            })

        })
    },

    delete: function(opts) {
        return getRegistration().getNotifications(opts)
        .then((notifications) => {
            if (opts && opts.index) {
                return notifications[opts.index].close();
            }

            notifications.forEach((n) => n.close())

        })
    },
    addListeners() {
        self.addEventListener('notificationclick', notification.parseNotificationAction);
        self.addEventListener('notificationclose', notification.parseNotificationClose);
        self.addEventListener('push', notification.receivePush);
    }
}

module.exports = notification;
