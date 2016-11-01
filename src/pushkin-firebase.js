const getRegistration = require('./util/get-registration');
const config = require('./config');

const pushkinRequest = function(endpoint, method = 'GET', body = '') {
   
    if (!config.pushkinFirebase || !config.pushkinFirebase.key || !config.pushkinFirebase.host) {
        throw new Error("Must set both pushkin key and host config variables");
    }
    
    let headers = new Headers();
    headers.set('Authorization', config.pushkinFirebase.key);
    headers.set('Content-Type', 'application/json');
    
    return fetch(config.pushkinFirebase.host + endpoint, {
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
};



const getSubscriptionID = function() {
    return getRegistration().pushManager.getSubscription()
    .then((sub) => {
        return pushkinRequest("/registrations", "POST", {
            subscription: sub
        })
        .then((res) => {
            return res.id;
        })
    })
}

module.exports = {
    subscribeToTopic: function(opts) {  
        return getSubscriptionID()
        .then((subId) => {
            return pushkinRequest(`/topics/${opts.topic}/subscribers/${encodeURIComponent(subId)}`, 'POST', {
                confirmation_notification: opts.confirmationNotification
            })
        })
    },
    unsubscribeFromTopic: function(opts) {
        return getSubscriptionID()
        .then((subId) => {
            return pushkinRequest(`/topics/${opts.topic}/subscribers/${encodeURIComponent(subId)}`, 'DELETE', opts)
        })
    }
}