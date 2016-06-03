const getRegistration = require('./util/get-registration');
const analytics = require('google-analytics-protocol');
const run = require('./run-command');

const mapActionsToNotification = function(notification, actions) {
    
    /*
        We can't store data against notification actions themselves, all
        we can do is store a string. So instead we store our command data
        in the data attribute of the notification itself, and just set a
        index property on the 'action' property. Later, when processing 
        a notification click, we read that data back out again.
    */
    
    notification.actions = [];
    notification.data = notification.data || {};
    notification.data.commandSequences = [];
    notification.data.commandToActionLabelMap = [];
    notification.actions = [];
    
    actions.forEach((action) => {
        
        notification.data.commandSequences.push(action.commands);
        let commandString = "__command::" + String(notification.data.commandSequences.length - 1);

        notification.actions.push(Object.assign(action.template, {
            action: commandString
        }));
        
        // We use this in analytics to track which button was actually pressed
        notification.data.commandToActionLabelMap.push(action.template.title);
    })
};



const notification = {
    show: function(opts) {
        
        if (opts.actionCommands) {
            mapActionsToNotification(opts.options, opts.actionCommands);
        }
        
        return getRegistration().showNotification(opts.title, opts.options)
        .then(() => {
            analytics({
                t: 'event',
                ec: 'Notification',
                ea: 'show',
                el: opts.title
            })
        })
    },
    close: function(opts, event) {
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
        if (event.action === '' && event.notification.data && event.notification.data.onTap) {
            return event.waitUntil(
                run("commandSequence", {
                    sequence: event.notification.data.onTap,
                    event: event
                })
                .then(() => {
                    analytics({
                        t: 'event',
                        ec: 'Notification',
                        ea: 'tap',
                        el: event.notification.title
                    })
                })
            );
        }
        
        if (event.action.indexOf('__command') === 0) {
            // it's an action mapped to a command sequence.
            
            let sequenceIndex = parseInt(event.action.split("::")[1], 10);
            let commandSequence = event.notification.data.commandSequences[sequenceIndex];
            let actionLabel = event.notification.data.commandToActionLabelMap[sequenceIndex];
            
            run("commandSequence", {
                sequence: commandSequence,
                event: event
            })
            .then(() => {
                analytics({
                    t: 'event',
                    ec: 'Notification',
                    ea: 'tap-action',
                    el: actionLabel
                })
            })    
        }
    },
    parseNotificationClose(event) {
        
        analytics({
            t: 'event',
            ec: 'Notification',
            ea: 'close',
            el: event.notification.title
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
        console.log("received push", obj)
        
        event.waitUntil(
            run("commandSequence", {
                sequence: obj
            })
        );
        
    },
    addListeners() {
        self.addEventListener('notificationclick', notification.parseNotificationAction);
        self.addEventListener('notificationclose', notification.parseNotificationClose);
        self.addEventListener('push', notification.receivePush);
    }
}

module.exports = notification;