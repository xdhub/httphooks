var requestMethods = [
    // http://www.ietf.org/rfc/rfc2616.txt
    'GET',
    'POST',
    'PUT',
    'DELETE',
    // http://www.ietf.org/rfc/rfc5789.txt
    // 'PATCH'
].map(function (method) {
    return method.toLowerCase();
});

var hookListenerOrders = [
    'REQUEST',
    'PRE',
    'POST',
    'RESPONSE'
].map(function (order) {
    return order.toLowerCase();
});

var hookListenerTypes = hookListenerOrders.map(function (order) {
    return ((order !== '' ? order + '-' : '') + 'LISTENER').toLowerCase();
});

var hookResponderOrders = [
    'PRE',
    '',
    'POST'
].map(function (order) {
    return order.toLowerCase();
});

var hookResponderTypes = hookResponderOrders.map(function (order) {
    return ((order !== '' ? order + '-' : '') + 'RESPONDER').toLowerCase();
});

var hookTypes = hookListenerTypes.concat(hookResponderTypes);

module.exports = {
    requestMethods: requestMethods,
    hookListenerOrders: hookListenerOrders,
    hookResponderOrders: hookResponderOrders,
    hookListenerTypes: hookListenerTypes,
    hookResponderTypes: hookResponderTypes,
    hookTypes: hookTypes
};
