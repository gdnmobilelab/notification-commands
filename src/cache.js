const PromiseTools = require('promise-tools');

export default {
    addToCache(opts) {
        return caches.open(opts.cacheName)
        .then(function(cache) {
            return cache.addAll(opts.urls);
        })
    },
    clear(opts) {
        return caches.open(opts.cacheName)
        .then((cache) => {
            return cache.keys()
            .then((keys) => {
                return PromiseTools.map(keys, (key) => cache.delete(key))
            })
        })
    },
    delete(opts) {
        return caches.open(opts.cacheName)
        .then((cache) => {
            return PromiseTools.map(opts.urls, (url) => cache.delete(url))
        })   
    }
}