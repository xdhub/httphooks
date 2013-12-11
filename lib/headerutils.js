var clone = require('clone');

var getActualHeaderName = function (headers, name) {
    var normalizedHeaderName = name.toLowerCase();
    var actualHeaderName = null;
    for (var headerName in headers) {
        if (headerName.toLowerCase() === normalizedHeaderName) {
            actualHeaderName = headerName;
            break;
        }
    }

    return actualHeaderName;
};

var mergeHeaders = function (headers1, headers2) {
    var mergedHeaders = clone(headers1);
    for (var headerName in headers2) {
        var actualHeaderName = getActualHeaderName(mergedHeaders, headerName);
        mergedHeaders[actualHeaderName || headerName] = headers2[headerName];
    }

    return mergedHeaders;
};

module.exports = {
    getActualHeaderName: getActualHeaderName,
    mergeHeaders: mergeHeaders
};
