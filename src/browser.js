
module.exports = {
    openURL: function({url}) {
        console.log("do match")
        return clients.matchAll({
            includeUncontrolled: true
        }).then(function(clientList) {
            console.log("do list")
            try {
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].url === url && 'focus' in clientList[i]) {
                        return clientList[i].focus();
                    } 
                }
            } catch (err) {
                console.error(err);
            }
            console.log("open window")
            return clients.openWindow(url);
        });
        
    }
}