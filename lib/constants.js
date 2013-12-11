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

var hookOrders = [
    'PRE',
    'IN',
    'POST'
].map(function (order) {
    return order.toLowerCase();
});

var hookTypes = [
    'LISTENER',
    'RESPONDER'
].map(function (type) {
    return type.toLowerCase();
});

module.exports = {
    requestMethods: requestMethods,
    hookOrders: hookOrders,
    hookTypes: hookTypes
};
