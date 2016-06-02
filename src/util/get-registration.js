// Different when inside and outside of a service worker.
// Need to finish - Service Worker code only for now.

module.exports = function() {
    return self.registration;
}