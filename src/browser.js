
module.exports = {
    openURL: function({url}) {
        return clients.matchAll({
            includeUncontrolled: true
        }).then(function(clientList) {
            try {
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].url === url) {
                        return clientList[i].focus();
                    } 
                }
            } catch (err) {
                console.error(err);
            }
            return clients.openWindow(url);
        });
        
    }
}