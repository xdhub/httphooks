//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// THIS CODE IS PROVIDED ON AN  *AS IS* BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT
// LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR
// A PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
//
// See the Apache Version 2.0 License for specific language governing
// permissions and limitations under the License.
//

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
