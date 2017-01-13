
function resolveURL(url) {
    
    if (url.indexOf('://') > -1) {
        // already full URL
        return url;
    }

    if (url[0] === '/') {
        // is relative to root
        let hostname = /([a-z]*):\/\/(.*?)\//.exec(self.registration.scope);
        return hostname[1] + "://" + hostname[2] + url;
    }

    if (self.registration.scope.substr(-1) === '/') {
        // Scope ends with slash, that's easy
        return self.registration.scope + url;
    }

    // Otherwise get relative to the directory, then apply
    let scopeSplit = self.registration.scope.split('/');

    scopeSplit.pop();

    return scopeSplit.join("/") + url;


}


module.exports = {
    openURL: function({url, options}) {

        let urlRelativeToScope = resolveURL(url);

        return clients.matchAll({
            includeUncontrolled: true
        }).then(function(clientList) {
            console.log("CLIENT: do list")
            try {
                for (let i = 0; i < clientList.length; i++) {
                    console.log("open URL:" + urlRelativeToScope)
                    console.log("client URL: " + clientList[i].url + ", has focus: " + String('focus' in clientList[i]))
                    if (clientList[i].url === urlRelativeToScope && 'focus' in clientList[i]) {
                        return clientList[i].focus();
                    } 
                }
            } catch (err) {
                console.error(err);
            }
            console.log("CLIENT: open window")
            return clients.openWindow(url, options);
        });
        
    }
}