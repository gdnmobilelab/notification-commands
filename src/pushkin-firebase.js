const getRegistration = require('./util/get-registration');
const config = require('./config');
const db = require('./util/db');

const dbStore = db.store("pushkinSubscriptions");

const pushkinRequest = function(endpoint, method = 'GET', body = null) {
   
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
        body: body ? JSON.stringify(body) : null
    })
    .then((response) => {
        if (!response.status || response.status < 200 || response.status > 299) {
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
        if (!sub) {
            throw new Error("No subscription to check")
        }
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

        let confirmOpts = {};

        if (opts.confirmationPayload) {
            confirmOpts.confirmation_notification = {
                ttl: 60,
                payload: opts.confirmationPayload,
                service_worker_url: self.registration.active.scriptURL,
                priority: 'high',
                ios: opts.confirmationIOS
            }
        }

        return getRegistration().pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: new Uint8Array([4, 51, 148, 247, 223, 161, 235, 177, 220, 3, 162, 94, 21, 113, 219, 72, 211, 46, 237, 237, 178, 52, 219, 183, 71, 58, 12, 143, 196, 204, 225, 111, 60, 140, 132, 223, 171, 182, 102, 62, 242, 12, 212, 139, 254, 227, 249, 118, 47, 20, 28, 99, 8, 106, 111, 45, 177, 26, 149, 176, 206, 55, 192, 156, 110])
        })
        .then(() => {
            return getSubscriptionID()
        })
        .then((subId) => {
            return pushkinRequest(`/topics/${opts.topic}/subscribers/${encodeURIComponent(subId)}`, 'POST', confirmOpts)
            .then((response) => {
                return dbStore.put({
                    topic_id: opts.topic,
                    subscribeDate: Date.now()
                })
                .then(() => {
                    return response;
                })
            })
        })
        
    },
    unsubscribeFromTopic: function(opts) {
        return getSubscriptionID()
        .then((subId) => {
            return pushkinRequest(`/topics/${opts.topic}/subscribers/${encodeURIComponent(subId)}`, 'DELETE', opts)
        })
        .then(() => {
            return dbStore.del(opts.topic)
        })
    },
    getSubscribedTopics: function(opts) {
        return dbStore.all()
        .then((objs) => {
            return objs.map((o) => o.topic_id);
        })
        // return getSubscriptionID()
        // .then((subId) => {
        //     return pushkinRequest(`/registrations/${encodeURIComponent(subId)}/topics`)
        // })
    }
}