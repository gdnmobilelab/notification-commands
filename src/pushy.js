const getRegistration = require('./util/get-registration');
const config = require('./config');

const pushyRequest = function(endpoint, method = 'GET', body = '') {
   
    if (!config.pushy || !config.pushy.key || !config.pushy.host) {
        throw new Error("Must set both pushy key and host config variables");
    }
    
    let headers = new Headers();
    headers.set('x-api-key', config.pushy.key);
    headers.set('Content-Type', 'application/json');
    
    return fetch(config.pushy.host + endpoint, {
        method: method,
        mode: 'cors',
        headers: headers,
        body: JSON.stringify(body)
    })
    .then((response) => {
        if (response.status < 200 || response.status > 299) {
            return response.text()
            .then((text) => {
                throw new Error(text);
            })
        }
        return response.json()
        .then((json) => {
            if (json.errorMessage) {
                throw new Error(json.errorMessage);
            }
            return json;
        })
    })
}

module.exports = {
    subscribeToTopic: function(opts) {
        return getRegistration().pushManager.getSubscription()
        .then((sub) => {
            if (sub === null) {
                throw new Error("Subscription has to be created outside of Service Worker first (no idea why)")
            }
            return pushyRequest(`/topics/${opts.topic}/subscriptions`,'POST', {
                type: 'web',
                data: sub,
                confirmationNotification: opts.confirmationNotification
            })
        })
        .catch((err) => {
            console.error(err);
            throw err;
        })
    },
    unsubscribeFromTopic: function(opts) {
        return getRegistration().pushManager.getSubscription()
        .then((sub) => {
            return pushyRequest(`/topics/${opts.topic}/subscriptions`,'DELETE', {
                type: 'web',
                data: sub,
                confirmationNotification: opts.confirmationNotification
            })
        })
    },
    getSubscribedTopics: function() {
        return getRegistration().pushManager.getSubscription()
        .then((sub) => {
            if (!sub) {
                return null;
            }
            return pushyRequest('/get-subscriptions', 'POST', {type: 'web', data: sub})
            
        })
    }
}