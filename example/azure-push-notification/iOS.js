var notificationHubName = '';
var notificationHubConnectionString = '';

var sendNotification = function (hookContext, done) {
    var azure = require('azure');
    var notificationHubService = azure.createNotificationHubService(notificationHubName, notificationHubConnectionString);
    var payload = JSON.parse(hookContext.request.content);
    var tags = null;
    if (payload.tags instanceof Array) {
        tags = payload.tags;
        delete payload.tags;
    }

    notificationHubService.apns.send(tags, payload, function (error) {
        var statusCode = !error ? 200 : 500;
        var content = !error ? {} : { error: error };
        hookContext.setResponse(
            statusCode,
            { 'Content-Type': 'application/json' },
            JSON.stringify(content));
        done();
    });
};

module.exports = {
    sendNotification: sendNotification
};
