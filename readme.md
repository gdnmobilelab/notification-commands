# notification-commands

A set of commands we use inside the service worker (usually in response to push events)
to load items into IndexedDB, show notifications, etc.

## How do I use it?

If you only want to respond to push events, just `require()` this module somewhere in your
service worker code and it will hook into the `push`, `notificationclick` and `notificationclose` 
events automatically.

If you want to be able to call these commands from the browser, you need to also include the
[service-worker-command-bridge](https://github.com/gdnmobilelab/service-worker-command-bridge)
module. Then, run the following:

    var bridge = require('service-worker-command-bridge');
    var notificationCommands = require('notification-commands');

    notificationCommands.register(bridge);

Now you can do the following in the client:

    runServiceWorkerCommand("notification.show", {
        title: "test notification"
    });

## Set configuration options

If you want to use other services like Pushy you need to set configuration options via the `setConfig`
command. Like so:

    notificationCommands.setConfig({
        pushy: {
            key: "KEY",
            host: "https://api.endpoint"
        }
    });

## Commands

A small sample of available commands:

- `notification.show(opts)`: show a notification. See details below for keys.
- `notification.close()`: close the active notification.
- `pushy.subscribeToTopic(opts)`: subscribe the user to a broadcast topic. Opts object keys:
  - `topic`: The ID of the topic to subscribe to.
- `pushy.unsubscribeFromTopic(opts)`: remove an existing subscription. Opts object keys:
  - `topic`: The ID of the topic to unsubscribe from.
- `browser.openURL`: Open a page in the user's browser. Opts object keys:
  - `url`: URL to open

## Notification format

The `notification.show` command has a very complicated syntax. A guide:

    runCommand("notification.show", {
        title: "Notification Title",
        options: {
            body: "Notification body"
        }
    })

in this basic example, the `title` attribute becomes the first argument in the `showNotification()` call,
and the `options` attribute becomes the second. So:

    self.registration.showNotification("Notification Title", {
        body: "Notification body"
    })

So, if you want to add any [additional attributes](https://developer.mozilla.org/en-US/docs/Web/API/notification),
just put them in the options object. _Except actions_.

### Actions

These are a little more complicated, because we want to hook up commands to actions, which the standard
API does not let us do. So when we want to add actions, we add a third key to our `runCommand` argument, 
`actionCommands`:

    runCommand("notification.show", {
        title: "Notification Title",
        options: {
            body: "Notification body"
        },
        actionCommands: [
            commands: [
                {
                    command: "notification.close"
                }
            ],
            template: {
                title: "Close"
            }
        ]
    })

On Android you can currently only provide two actions in this array. The `commands` key is an array of
commands you want to run when the user taps on that notification. The `template` key is the action
options that will be passed through to the 
[native API](https://developers.google.com/web/updates/2016/01/notification-actions) - currently only
`title` and `icon` are supported.